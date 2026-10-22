#!/usr/bin/env node
/**
 * 抖音 / 小红书热榜快照 —— `web/public/assets/data/video-boards.json`。
 *
 * ## 2026-10-16 复测：通路此前被记为"做不了"，这次找到了
 * `docs/trend-sources.md` 曾在 2026-10-16 之前记下"抖音/小红书无可用公开接口"
 * —— 那次测的是 douyin.com 官方端点与 vvhan/tenapi/oioweb 等一批镜像，
 * 它们当时确实全挂。这次换了一批镜像重测，**uapis 的全网热榜聚合是活的**：
 *   · `GET https://uapis.cn/api/v1/misc/hotboard?type=douyin`       → 200 JSON，50 条
 *   · `GET https://uapis.cn/api/v1/misc/hotboard?type=xiaohongshu`  → 200 JSON，20 条
 * 它也是聚合镜像（上游是各平台的热榜），不是官方端点 —— 随时可能再挂，
 * 所以脚本保留了"逐源回退、全失败不写文件"的同一套失败语义，并在
 * docs/trend-sources.md 里如实记为"镜像通路"。
 * （微信视频号这次也复测了：官方排行页要登录态、uapis/60s/tenapi/RSSHub/
 *   tophub 均无此榜 —— 仍然没有可用通路，结论不变，见 docs。）
 *
 * ## 条目形状
 * uapis 给 `{index, title, url, hot_value, extra?, cover?}`：
 *   · `url` 是**平台内搜索页**（抖音 `douyin.com/search/…`、小红书
 *     `xiaohongshu.com/search_result?keyword=…`）—— 热榜条目本来就没有
 *     单独落地页，搜索页就是读者点进去真正要去的地方；
 *   · `hot_value` 抖音是**原始数字字符串**（"11650725"），小红书是
 *     **带单位的粗粒度串**（"947.5w"）→ 统一格式化成中文量级（"1165.1万"）
 *     再进 `extra`，页面照 momoyu 那套"热度文字"直接显示；
 *   · `cover` 封面图**不收**：快照要小，页面也不加载第三方图片。
 *
 * ## 抖音的备援通路
 * 60s API（`https://60s-api.viki.moe/v2/douyin`）实测也有抖音热榜
 * （`{title, hot_value(数字), link}`）。uapis 挂了就试它 —— 两家都是镜像，
 * 同时挂的概率低于单家。小红书没有第二家，只有 uapis 一条路。
 *
 * ## 失败语义
 * 与 fetch-google-trends.mjs 同一套：某榜取不到 → 记 `skipped`（其它照常）；
 * **全部**取不到才非零退出、不写文件，旧快照原样保留（宁可旧，不可错）。
 *
 * ## 手动跑
 *   npm run snap:video
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** 只有"直接运行"才跑主流程 —— 测试 import 归一化函数时不能触发抓取 */
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/video-boards.json'
);

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';

/** 每榜保留条数。uapis 抖音给 50、小红书给 20 —— 全收，不额外截断 */
const PER_BOARD_LIMIT = Infinity;
/** 少于这个榜数 = 结构变了/半截数据，拒绝产出（与 momoyu 的 MIN_SOURCES 同一个理由） */
const MIN_BOARDS = 1;
const MIN_ITEMS = 1;

/**
 * 榜清单。key 即快照里的 `source_key`（boards.js 的 BOARD_TAGS 用同名 slug）。
 * fallback 只给抖音配了 —— 小红书实测只有 uapis 一家镜像。
 */
export const BOARDS = [
  {
    key: 'douyin',
    name: '抖音热榜',
    url: 'https://uapis.cn/api/v1/misc/hotboard?type=douyin',
    fallbackUrl: 'https://60s-api.viki.moe/v2/douyin',
  },
  {
    key: 'xiaohongshu',
    name: '小红书热榜',
    url: 'https://uapis.cn/api/v1/misc/hotboard?type=xiaohongshu',
    fallbackUrl: null,
  },
];

/**
 * 热度数值 → 中文量级文字。
 *   · 抖音给原始数字串 "11650725" → "1165.1万"；
 *   · 小红书给 "947.5w"（w = 万）→ "947.5万"；
 *   · 亿以内保留一位小数，不足一万原样给（热榜头部用不到这一档）。
 * 两家都是**精确数值**（不是 Google 那种 "2000+" 粗粒度串），格式化只是
 * 换个写法，不损失信息 —— 与"保留原文不解析"不冲突。
 */
export function formatHotValue(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  // "947.5w" / "947.5W" → 9475000；纯数字直接用
  const m = s.match(/^([\d.]+)\s*[wW]$/);
  const n = m ? Number(m[1]) * 1e4 : Number(s.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return s; // 解析不了就保留原文，不硬造
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return String(Math.round(n));
}

/** uapis 的 {list:[…]} / 60s 的 data 数组 → 统一条目（title/url/extra） */
export function normalizeItems(list) {
  return (Array.isArray(list) ? list : [])
    .slice(0, PER_BOARD_LIMIT)
    .map((x) => {
      const title = String(x?.title || '').trim();
      const url = String(x?.url || x?.link || '').trim();
      return { title, url, extra: formatHotValue(x?.hot_value) };
    })
    .filter((x) => x.title && x.url);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error(`非 JSON 响应（${ct.split(';')[0] || 'unknown'}）—— 上游多半变了`);
  return res.json();
}

/** 一个榜：主通路 → 备援通路，都失败才抛 */
async function fetchBoard(board) {
  const attempts = [board.url, board.fallbackUrl].filter(Boolean);
  let lastErr;
  for (const url of attempts) {
    try {
      const j = await getJson(url);
      const list = Array.isArray(j) ? j : j.list || j.data || [];
      const items = normalizeItems(list);
      if (items.length < MIN_ITEMS) throw new Error('条目数为 0');
      // 60s 的条目没有 url 之外的标识，同一套 normalize 已处理；这里只看结果
      return { board, items, fetchedAt: new Date().toISOString() };
    } catch (e) {
      lastErr = e;
      console.warn(`  ✗ ${board.key} ← ${new URL(url).host}  ${e.message}`);
    }
  }
  throw lastErr || new Error('无可用通路');
}

/** 快照组装（导出给测试：给两块真实形状的响应，断言落盘形状） */
export function buildSnapshot(blocks, skipped = []) {
  return {
    fetchedAt: new Date().toISOString(),
    skipped,
    sources: blocks.map(({ board, items, fetchedAt }) => ({
      key: board.key,
      name: board.name,
      fetchedAt,
      items,
    })),
  };
}

async function main() {
  const blocks = [];
  const skipped = [];
  for (const board of BOARDS) {
    try {
      const { items, fetchedAt } = await fetchBoard(board);
      blocks.push({ board, items, fetchedAt });
      console.log(`  ✓ ${board.name}  ${items.length} 条 · 榜首「${items[0].title.slice(0, 30)}」`);
    } catch (e) {
      skipped.push({ key: board.key, name: board.name, reason: String(e.message).slice(0, 80) });
      console.warn(`  ✗ ${board.name}  ${e.message}`);
    }
  }

  if (blocks.length < MIN_BOARDS) {
    console.error(`✗ 一个榜都没取到 —— 旧快照保留，不写文件`);
    process.exit(1);
  }

  const snapshot = buildSnapshot(blocks, skipped);
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  // ★ 2026-10-19 按面板拆分：每个榜各写一份 `data/<key>.json`（与 fetch-momoyu-hot.mjs 同口径）。
  //   注意 blocks 的原始形状是 {board, items, fetchedAt}（key 在 board.key 上）。
  const dataDir = path.dirname(OUT_PATH);
  for (const b of blocks) {
    const key = b?.board?.key;
    if (!key || !Array.isArray(b.items)) continue;
    await fs.writeFile(
      path.join(dataDir, `${key}.json`),
      JSON.stringify({ key, name: b.board.name, fetchedAt: b.fetchedAt, items: b.items }, null, 1) + '\n'
    );
  }
  const total = blocks.reduce((n, b) => n + b.items.length, 0);
  console.log(`✓ ${blocks.length} 个榜 · 共 ${total} 条 · 写入 ${path.relative(process.cwd(), OUT_PATH)}`);
  if (skipped.length) console.log(`  跳过：${skipped.map((s) => s.name).join(' · ')}`);
}

if (isMain) await main();
