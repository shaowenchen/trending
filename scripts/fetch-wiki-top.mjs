#!/usr/bin/env node
/**
 * 维基百科「全球热词」快照 —— `web/public/assets/data/wiki-top.json`。
 *
 * ## 与站内 `wikiAttention` 的分工
 * `wikiAttention` 是**手挑出来的 AI 词条**的浏览量（回答"AI 这个词被看多少"）。
 * 这一张是**维基官方当日全站阅读 Top**（回答"全世界此刻在查什么"）—— 前者是
 * 主题切片，后者是大众注意力全景。两张榜共用同一个上游，但口径完全不同。
 *
 * ## 数据通路
 * `wikimedia.org/api/rest_v1/metrics/pageviews/top/{zh,en}.wikipedia/all-access/{Y}/{M}/{D}`
 * 实测 `access-control-allow-origin: *` → 浏览器可直连（`trend.js` 直连优先），
 * 本快照是兜底。
 *   · 取**前一日 UTC**（当日数据尚未结算）；
 *   · 中英两榜各取前 20，合并成一个面板，每条带语言标签。
 *
 * ## 过滤
 * 维基的 top 榜里混着大量非条目页：`Main_Page`、`Special:*`、`Wikipedia:*`、
 * `Portal:*`、`File:*`、`Help:*`，以及首页的各语言写法（`Wikipedia:首页` 等）。
 * 这些不是"大家在查的东西"，全部剔除。
 *
 * ## 失败语义
 * 单语种失败 → 跳过并记 skipped；两语种都失败 → 非零退出、不写文件。
 *
 * ## 手动跑
 *   npm run snap:wiki-top
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/wiki-top.json'
);
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';
const PER_LANG = 20;
const MIN_TOTAL = 5;

/** 中英两个语种（顺序 = 面板里的排列顺序） */
export const WIKI_TOP_LANGS = [
  { code: 'zh', label: '中文维基' },
  { code: 'en', label: '英文维基' },
];

/** 非条目页：导航页、特殊页、名字空间页、首页的各种写法 */
const SKIP_RE =
  /^(Main_Page|Special:|Wikipedia:|Portal:|File:|Help:|Template:|Category:|Talk:|User:|MediaWiki:|Draft:|Module:|Book:|TimedText:)/;

/** 判定一条是否"真条目"（导出给测试） */
export function isArticleTitle(title) {
  const t = String(title ?? '').trim();
  if (!t) return false;
  if (SKIP_RE.test(t)) return false;
  // 首页的多语言写法：Wikipedia:首页 / メインページ / Заглавная_страница …
  if (/^(首页|首頁|メインページ|대문|Заглавная_страница|Hauptseite|Portada|Accueil)$/.test(t)) return false;
  return t.includes('_') || t.length > 1; // 单词标题也算（如 "Python"）
}

/** 上游响应 → 标准条目（导出给测试） */
export function normalizeWikiTop(json, langLabel, limit = PER_LANG) {
  const items = json?.items?.[0]?.articles;
  const rows = Array.isArray(items) ? items : [];
  return rows
    .filter((a) => isArticleTitle(a?.article))
    .slice(0, limit)
    .map((a) => ({
      title: String(a.article).replace(/_/g, ' '),
      views: Number.isFinite(Number(a.views)) ? Number(a.views) : null,
      lang: langLabel,
      url: `https://${a.article ? '' : ''}`, // 由调用方按语种补全
      article: String(a.article),
    }));
}

function ymd(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
}

/**
 * wikimedia pageviews 的结算延迟实测是 **T+2**（T-1 常返回 404 "we either do not
 * have data for those date(s)"），不是注释里早先假设的 T+1。逐日回退到能取到数据
 * 的那天，最多回退 RETRY_DAYS 天，避免整条工作流因为一天的数据没结算就红。
 */
const RETRY_DAYS = 3;

async function fetchDay(code, day) {
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${code}.wikipedia/all-access/${day}`;
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': UA },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function main() {
  const blocks = [];
  const skipped = [];
  let day = '';
  for (const { code, label } of WIKI_TOP_LANGS) {
    let rows = null;
    let lastErr = null;
    for (let offset = 1; offset <= RETRY_DAYS; offset++) {
      const cand = ymd(new Date(Date.now() - offset * 24 * 3600 * 1000));
      try {
        const json = await fetchDay(code, cand);
        const parsed = normalizeWikiTop(json, label);
        if (!parsed.length) throw new Error('过滤后 0 条');
        rows = parsed;
        if (cand !== day) {
          if (!day) day = cand;
          else console.warn(`  ! ${label} 与其他语种日期不同（${cand} vs ${day}）`);
        }
        console.log(`  · ${label} 使用 ${cand} 的数据（回退 ${offset} 天）`);
        break;
      } catch (e) {
        lastErr = e;
        // 只有 404（该日未结算）才值得继续回退；其他错误直接放弃该语种
        if (e.status && e.status !== 404) break;
      }
    }
    if (rows) {
      // 条目地址按语种拼（标题里的空格换回下划线）
      for (const r of rows) {
        r.url = `https://${code}.wikipedia.org/wiki/${encodeURIComponent(r.article)}`;
        r.project = code;
      }
      blocks.push({ key: code, name: label, items: rows });
      console.log(`  ✓ ${label}  ${rows.length} 条 · 榜首「${rows[0].title}」${rows[0].views} 次`);
    } else {
      skipped.push({ key: code, name: label, reason: String(lastErr?.message || 'unknown').slice(0, 80) });
      console.warn(`  ✗ ${label}  ${lastErr?.message}`);
    }
  }
  const total = blocks.reduce((n, b) => n + b.items.length, 0);
  if (total < MIN_TOTAL) {
    console.error(`✗ 只取到 ${total} 条（< ${MIN_TOTAL}）—— 旧快照保留，不写文件`);
    process.exit(1);
  }
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    date: day,
    skipped,
    // 与站内其它多来源快照同形（sources/items），页面用同一个摊平函数
    sources: blocks.map((b) => ({ key: b.key, name: b.name, fetchedAt: new Date().toISOString(), items: b.items })),
  };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  console.log(`✓ ${blocks.length} 个语种 · 共 ${total} 条 · 数据日期 ${day} · 写入 ${path.relative(process.cwd(), OUT_PATH)}`);
}

if (isMain) await main();
