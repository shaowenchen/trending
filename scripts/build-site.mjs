#!/usr/bin/env node
/**
 * 构建：把**该发布的文件**从 `web/public/` 复制到 `dist/`，落掉 `{{…}}` 占位符。
 *
 * ## 为什么这一步存在（GitHub Pages 明明可以直接发仓库目录）
 * 有两个理由，都不是"想加构建步骤"：
 *
 *  1. **占位符必须落成真值。** GTM 容器 ID（`src/site/gtm.js`）只有一处来源，
 *     页面里写 `{{GTM}}`；主题引导、导航、索引条、主题分段同理（各自的
 *     `{{…}}` 占位符）。站点是纯静态的，没有"响应时"，替换只能发生在构建这一步。
 *     发布出去的 HTML 里出现未替换的 `{{XXX}}` 就是缺陷（访客直接看到字面量），
 *     构建会为此失败。（品牌词曾是 `{{BRAND}}`，2026-10-20 晚起标题/页头改为
 *     各语言骨架文案，该占位符退役 —— 见 `src/site/brand.js` 顶部。）
 *
 *  2. **发布集合必须是白名单。** `web/public/assets/` 下同时住着运行时脚本与
 *     `*.test.js`。用"排除"式规则（复制一切、排除测试）的话，将来加一个
 *     `foo.local.js`、`.DS_Store`、草稿页，它会**静默上线**。
 *     白名单的失效方式是"新文件不发布"（看得见），排除式的失效方式
 *     是"不该发布的发布了"（看不见）。这里选前者。
 *
 * ## 为什么写 `.nojekyll`
 * GitHub Pages 默认跑 Jekyll。本站不需要它，也不希望它：页面是**手写**的，
 * 多一层我们控制不了的变换，会让"本地打开 dist 看到的"与"线上真正跑的"出现差别。
 * 空的 `.nojekyll` 让 Pages 原样发布 dist/。
 * （Actions 那条路（upload-pages-artifact）本来就是原样打包，这个文件是给
 *  "从分支直接发布"那条路兜底的 —— 两条路都别让 Jekyll 插手。）
 *
 * ## 校验（不通过就非零退出，别把坏产物发上去）
 *   · 任何发布文件里残留 `{{…}}` 占位符 → 失败；
 *   · 页面里引用的相对资源（css / js）不在发布集合里 → 失败
 *     （这是静态站最典型的"白屏"成因：路径写错、文件没复制进去，本地看还好，
 *      线上 404，而页面上什么都不会说）；
 *   · 发布出去的脚本里 `import` 了不在发布集合里的文件 → 失败
 *     （同上，只是另一个解析链：HTML 的 `href`/`src` 之外，ES module 还会
 *      顺着 import 继续取文件。这条曾漏过一次，见 `findMissingImports`）；
 *   · 发布集合里出现 `*.test.js` → 失败。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BRAND, findUnresolvedPlaceholders } from '../src/site/brand.js';
import { injectGtm } from '../src/site/gtm.js';
// 主题引导脚本（head 里那段同步内联脚本）：正文从 assets/theme.js 的
// bootSnippet() 取，与主题模块共用同一个 localStorage 键 —— 见该文件顶部。
import { injectThemeBoot } from '../src/site/theme-boot.js';
// 面板 id 与标签的真值住在 `web/public/assets/` 下 —— 浏览器只能拿到发布集合里的
// 文件，所以它必须在浏览器够得着的地方，Node 这边隔着目录引它没问题（见该文件顶部）。
import { injectNav, injectIndex, injectTopics } from '../src/site/nav.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 发布集合 —— **白名单**，相对 `web/public/`。
 *
 * 扁平站之后只有**两个页面**：`index.html`（中文）与 `en/index.html`（英文）。
 * 34 个榜单全部在这两页上铺开（`trend.js` 运行时建骨架 + 懒加载），
 * 原来的 34×2 个榜单页与 `tags.html` / `tag.html` 都已删除。
 *
 * 这份清单必须与源码目录**完全对齐** —— 少登记一个，线上 404（比如某个快照
 * JSON 没发布）；多登记一个不存在的文件，构建会因为读不到文件而失败
 * （`site.test.js` 另有一条断言比对两者）。
 */
export const SITE_FILES = [
  'index.html',
  'site.css',
  'en/index.html',
  // ★ 2026-10-19 移动端标签页适配：favicon 全套 + PWA manifest（首页与 en 页 head 都引用）
  'favicon.svg',
  'favicon-32.png',
  'favicon-48.png',
  'apple-touch-icon.png',
  'icon-512.png',
  'manifest.webmanifest',
  'assets/trend.js',
  'assets/boards.js',
  'assets/ui.js',
  'assets/i18n.js',
  // 主题切换（三态 + 页头按钮）。★ 它必须在发布集合里：`index.html` 里有
  // `<script src="assets/theme.js" type="module">`，而 `findMissingAssets`
  // 会照着这条 src 校验 —— 漏登记不是"少一个功能"，是**构建直接失败**。
  'assets/theme.js',
  // 2026-10-19 每日视图：名言库（同步 import，必须随页发布）+ 历史上的今天快照
  'assets/quotes.js',
  'assets/data/onthisday.json',
  'assets/data/onthisday-en.json',
  // 构建期快照（scripts/fetch-*.mjs 生成并提交；在白名单里 = 文件缺失会让
  // 构建直接失败，而不是线上悄悄 404）
  'assets/data/gh-trending.json',
  'assets/data/ai-news.json',
  'assets/data/ai-press.json',
  'assets/data/cn-hot.json',
  // 2026-10-16 新增三张榜的快照
  'assets/data/hn-top.json',
  'assets/data/wiki-attention.json',
  'assets/data/google-trends.json',
  // 视频/生活方式热榜的快照（抖音/小红书，uapis 镜像，见 fetch-video-boards.mjs）
  'assets/data/video-boards.json',
  // ★ 2026-10-19 按面板拆分的逐榜快照（loadHotList 逐面板懒加载；缺失=构建失败）
  'assets/data/aifaner.json',
  'assets/data/bilibili.json',
  'assets/data/csdn.json',
  'assets/data/douban.json',
  'assets/data/douyin.json',
  'assets/data/hupu.json',
  'assets/data/huxiu.json',
  'assets/data/itzhijia.json',
  'assets/data/juejin.json',
  'assets/data/toutiao.json',
  'assets/data/weibo.json',
  'assets/data/xiaohongshu.json',
  'assets/data/zhidemai.json',
  'assets/data/zhihu.json',
  'assets/data/zhongguancun.json',
  // 2026-10-20 逐榜快照（原"线上直拉"的 18 个榜全部落站内，fetch-live-boards.mjs 生成）
  'assets/data/trending.json',
  'assets/data/liked.json',
  'assets/data/downloaded.json',
  'assets/data/spaces.json',
  'assets/data/datasets.json',
  'assets/data/papers.json',
  'assets/data/newmodels.json',
  'assets/data/swebench.json',
  'assets/data/aider.json',
  'assets/data/repos.json',
  'assets/data/eval.json',
  'assets/data/openrouter.json',
  'assets/data/orCatalog.json',
  'assets/data/orTrends.json',
  'assets/data/orAuthors.json',
  'assets/data/orPerf.json',
  'assets/data/aaBench.json',
  'assets/data/orApps.json',
];

/* ================================================================== */
/* 校验                                                                */
/* ================================================================== */

/** 找出残留的占位符标记。返回 `[文件名, 标记]` 列表。 */
export function findPlaceholders(files) {
  const bad = [];
  for (const [rel, text] of Object.entries(files)) {
    for (const marker of findUnresolvedPlaceholders(text)) bad.push([rel, marker]);
  }
  return bad;
}

/**
 * 找出页面里引用的、**不在发布集合里**的相对资源。
 *
 * 跳过这些（它们不是"要存在的文件"）：
 *   · 绝对 URL、协议相对、锚点、`mailto:` 之类的协议链接；
 *   · `<base href>` —— 它指的是**目录**，不是资源；
 *   · 模板占位（`{{…}}`，构建期才落成真值）。
 *
 * 指向**目录**的引用（`./`、`../`、`en/`）按静态托管的目录语义解析成该目录的
 * `index.html` —— 也就是"点这个链接会打开哪个文件"。这正是语言切换链接
 * （`en/index.html` 里的 `../`）能被校验到的原因：它写错一个层级就是 404。
 */
export function findMissingAssets(files) {
  const have = new Set(Object.keys(files));
  const missing = [];
  for (const [rel, text] of Object.entries(files)) {
    if (!rel.endsWith('.html')) continue;
    const dir = path.posix.dirname(rel);
    // <base href> 指目录，不参与"资源是否存在"的校验
    const html = String(text).replace(/<base\b[^>]*>/gi, '');
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const raw = m[1].trim();
      if (!raw || /^(https?:)?\/\//.test(raw) || raw.startsWith('#') || /^[a-z]+:/i.test(raw)) continue;
      if (raw.includes('{{')) continue;
      const clean = raw.split(/[?#]/)[0];
      if (!clean) continue;
      const target = resolvePage(dir, clean);
      if (target === null) continue; // 越出站点根：由服务器那条规则处理，这里不管
      if (have.has(target)) continue;
      missing.push(`${rel} → ${raw}`);
    }
  }
  return missing;
}

/**
 * `dir` 目录下的一个相对引用，最终会打开哪个文件。
 * 目录引用补 `index.html`；越出站点根（`../../x`）返回 null。
 */
function resolvePage(dir, ref) {
  const joined = path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, ref));
  if (joined.startsWith('..')) return null;
  const isDirRef = ref.endsWith('/') || joined === '.' || joined === '';
  const file = isDirRef ? path.posix.join(joined, 'index.html') : joined;
  const norm = path.posix.normalize(file).replace(/^\.\//, '');
  return norm === '.' ? 'index.html' : norm;
}

/** 发布集合里不该出现的东西 */
export function findForbidden(files) {
  return Object.keys(files).filter((f) => f.endsWith('.test.js') || path.basename(f).startsWith('.'));
}

/**
 * 找出发布出去的**客户端脚本**里，import/export 指向了非发布文件的那些。
 *
 * ## 为什么这条必须单独有（它漏过一次，整站白屏）
 * 上面 `findMissingAssets` 只看 HTML 的 `href` / `src`。而 ES module 的
 * `import` 是**另一个**解析链：浏览器拿到一个 `assets/*.js`，会按里面的
 * 说明符继续去取它依赖的文件 —— 那个文件不在发布集合里，就 404。
 *
 * 现实里踩到的样子：`assets/trend.js` 曾经写着
 * `import { BOARD_IDS } from '../../../src/site/boards.js'`。
 * `src/site/` 从来不在发布集合里，于是浏览器请求
 * `https://<域名>/src/site/boards.js` → 404 → **整个模块不执行**，
 * 所有榜单页都是一片空白。而本地怎么跑都成功：构建、测试、CI 全都按
 * **文件系统路径** import 那个文件，它就在那儿。
 *
 * 所以这里按**发布物**的视角重算一遍：说明符必须相对本文件解析、且落在
 * 发布集合内。越出站点根（`../../..`）一律算错 —— 那是本地能解析、
 * 线上必然 404 的写法。
 *
 * 只认行首的 import/export 语句（本项目的 import 都是单行，写在行首）。
 * 注释里出现的示例不会被误判：JSDoc 的行首是 `*`。
 */
export function findMissingImports(files) {
  const have = new Set(Object.keys(files));
  const missing = [];
  for (const [rel, text] of Object.entries(files)) {
    if (!rel.endsWith('.js')) continue;
    const dir = path.posix.dirname(rel);
    for (const m of String(text).matchAll(/^[ \t]*(?:import|export)\s[^\n]*?['"]([^'"]+)['"]/gm)) {
      const raw = m[1];
      if (!raw.startsWith('.')) continue; // 裸标识符：无依赖站里不该出现，但也不归这条管
      const target = path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, raw));
      if (target.startsWith('..')) {
        missing.push(`${rel} → ${raw}（越出站点根，浏览器取不到）`);
      } else if (!have.has(target)) {
        missing.push(`${rel} → ${raw}`);
      }
    }
  }
  return missing;
}

/* ================================================================== */
/* 构建                                                                */
/* ================================================================== */

/**
 * 构建前的一道保险：产物目录必须是**一个可以安全清空的子目录**。
 *
 * 为什么值得写：下面有一句 `fs.rm(outDir, {recursive:true})` ——
 * 把 outDir 传成仓库根（或仓库的祖先目录）时，那行会**删掉源码**，
 * 而且是跑完才发现的。这类脚本通常由 CI 或别人传参调用，
 * 不能让一个参数失误造成不可逆的破坏。
 */
export function assertSafeOutDir(outDir, repoRoot) {
  const out = path.resolve(outDir);
  const root = path.resolve(repoRoot);
  if (out === root) throw new Error(`拒绝构建：产物目录不能是仓库根目录（${out}）`);
  // 文件系统根（`/`）是**所有**路径的祖先，但它不以 `${root}/` 开头 ——
  // 单独判一次，否则 `outDir='/'` 会一路走到 fs.rm 把整块盘删掉。
  // （判据是"自己的父目录还是自己"，`/` 与 Windows 的 `C:\` 都成立）
  if (path.dirname(out) === out) throw new Error(`拒绝构建：产物目录不能是文件系统根（${out}）`);
  if (root.startsWith(out + path.sep)) throw new Error(`拒绝构建：产物目录不能是仓库的祖先目录（${out}）`);
  if (path.basename(out) === '.git') throw new Error('拒绝构建：产物目录不能是 .git');
  return out;
}

/**
 * 读发布集合 → 落占位符 → 校验 → 写进 outDir。
 *
 * 顺序是 brand 再 gtm：两者互不引用，但 GTM 那一步会校验容器 ID 形状，
 * 放在后面可以让"品牌名漏替换"这类更常见的问题先报出来。
 * @returns {Promise<{outDir:string, files:string[]}>}
 */
export async function buildSite({ srcDir = path.join(ROOT, 'web', 'public'), outDir = path.join(ROOT, 'dist'), repoRoot = ROOT } = {}) {
  const safeOut = assertSafeOutDir(outDir, repoRoot);
  const files = {};
  // ★ 数据版本号（2026-10-21 JSON 缓存穿透）：扫描快照目录，取全部
  //   `assets/data/*.json` 里最新 `fetchedAt` 的毫秒时间戳。数据不动 v 不变
  //   （老访客继续吃缓存），任何一次快照更新 v 必变（?v= 新 URL 穿透缓存）。
  //   目录缺失/一个 fetchedAt 都读不到时退化为构建时刻（宁可多穿一次）。
  let dataV = 0;
  try {
    const dataDir = path.join(srcDir, 'assets', 'data');
    for (const name of await fs.readdir(dataDir)) {
      if (!name.endsWith('.json')) continue;
      try {
        const j = JSON.parse(await fs.readFile(path.join(dataDir, name), 'utf8'));
        const t = Date.parse((j && j.fetchedAt) || '');
        if (Number.isFinite(t) && t > dataV) dataV = t;
      } catch { /* 单个快照损坏不拖累整体版本号 */ }
    }
  } catch { /* 快照目录缺失 → 构建时刻兜底 */ }
  if (!dataV) dataV = Date.now();
  for (const rel of SITE_FILES) {
    const buf = await fs.readFile(path.join(srcDir, rel), 'utf8');
    // ★ 占位符只在 **HTML** 里替换。这里曾经对每个发布文件都跑一遍，于是
    //   `site.css` 注释里作为**说明**出现的 `{{SITE_NAV}}` 被整段导航 HTML 顶替 ——
    //   产物里是一段看着像损坏的 CSS。朴素字符串替换不认识"这只是注释"，
    //   所以按文件类型收口，并让说明文字不再写出占位符字面量。
    if (!rel.endsWith('.html')) {
      files[rel] = buf;
      continue;
    }
    // 扁平站只有两个页面，但仍是"中文页在根、英文页在 `en/` 下"两种层级，
    // 所以同一份导航要落成两套相对路径。见 `src/site/nav.js`。
    const isEn = rel === 'en/index.html' || rel.startsWith('en/');
    const lang = isEn ? 'en' : 'zh';
    let out = injectNav(buf, lang, isEn ? '../' : '');
    // 首页正文：粘性索引条 + 六个主题分段的骨架，都由构建期落值
    // （真值只有 `boards.js` 的面板/主题清单 + `i18n.js` 的文案各一处）
    out = injectTopics(injectIndex(out, lang), lang);
    // 主题引导脚本（head 里的同步内联脚本）。★ 必须与 brand/gtm 同在这一串里
    // 落值：漏了它，发布物里会留着 `{{THEME_BOOT}}` —— 下面的占位符门禁会失败，
    // 而不是把一个字面量发给访客（这正是白名单 + 门禁的好处）。
    out = injectThemeBoot(out);
    // ★ 2026-10-19 CSS 缓存穿透：给样式表引用带内容版本号。静态站 + CDN 场景下
    //   `site.css` 无版本参数会让老访客的浏览器一直用缓存的旧样式（改了移动端
    //   适配却看不到）。以 site.css 的 mtime 秒级时间戳做 ?v=，每次构建自动变化。
    const cssStat = await fs.stat(path.join(ROOT, 'web', 'public', 'site.css'));
    // 相对引用有两种写法：首页 `site.css`、英文页 `../site.css` —— 都要带版本号
    const cssV = Math.floor(cssStat.mtimeMs / 1000);
    out = out.replace(
      /(href=)(["'])site\.css\2/g,
      `$1$2site.css?v=${cssV}$2`).replace(
      /(href=)(["'])\.\.\/site\.css\2/g,
      `$1$2../site.css?v=${cssV}$2`);
    // ★ 2026-10-21 JSON 缓存穿透（owner 提出）：数据快照 JSON 会被浏览器/CDN
    //   缓存，每 2 小时的数据更新老访客可能看不到。HTML 里落的
    //   `window.__TREND_DATA_V__` 取**全部快照里最新 fetchedAt 的毫秒时间戳**：
    //   数据不动 v 不变（继续吃缓存），数据一动 v 必变（trend.js 拼的 ?v= 新
    //   URL 必然穿透）。一个 fetchedAt 都读不到时退化为构建时刻（宁可多穿一次）。
    out = out.replace(/\{\{DATA_V\}\}/g, String(dataV));
    files[rel] = injectGtm(out);
  }

  const problems = [];
  for (const [rel, marker] of findPlaceholders(files)) {
    problems.push(`${rel} 残留占位符 ${marker}`);
  }
  for (const f of findForbidden(files)) problems.push(`${f} 不该被发布（测试文件 / 隐藏文件）`);
  for (const m of findMissingAssets(files)) problems.push(`引用的资源不在发布集合里：${m}`);
  for (const m of findMissingImports(files)) problems.push(`脚本 import 的文件不在发布集合里：${m}`);
  if (problems.length) {
    throw new Error(`构建校验未通过：\n  · ${problems.join('\n  · ')}`);
  }

  await fs.rm(safeOut, { recursive: true, force: true });
  for (const [rel, text] of Object.entries(files)) {
    const target = path.join(safeOut, rel);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, text);
  }
  // 见文件头：别让 Jekyll 插手产物
  await fs.writeFile(path.join(safeOut, '.nojekyll'), '');

  return { outDir: safeOut, files: Object.keys(files) };
}

/* CLI */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { outDir, files } = await buildSite();
    const rel = path.relative(ROOT, outDir) || outDir;
    console.log(`\n  构建完成 · ${BRAND} · ${files.length} 个文件 → ${rel}/`);
    for (const f of files) console.log(`    ${f}`);
    console.log('  （+ .nojekyll）\n');
  } catch (e) {
    console.error(`\n  ✗ ${e.message}\n`);
    process.exitCode = 1;
  }
}
