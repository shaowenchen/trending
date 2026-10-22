/**
 * 逐榜快照：把 18 个"线上直拉"的榜全部落到站内 data/<key>.json（2026-10-20）。
 *
 * 背景：站上 39 个榜此前一半走站内快照（中文热榜/资讯/HN…），一半在浏览器里
 * 直拉上游 API（HuggingFace / OpenRouter / models.dev / GitHub…）。owner 定：
 * **每一个小的分类都是一个独立的 json 数据源，全部定时更新** —— 于是这份脚本
 * 把直拉的那一半也在构建期抓下来，站内 39 个榜从此全部是 `data/<key>.json`。
 *
 * 输出形状与热榜拆分一致：`{ key, name, fetchedAt, payload }`，
 * payload = 上游响应原样（多接口的榜 = 数组/对象按 loader 需要的组合），
 * 前端 trend.js 用 `boardData(key)` 优先读快照，文件缺失时才回落线上直拉。
 *
 * 容错策略：**单榜失败不炸整轮** —— 保留旧文件（站点永远有"最后一次成功"的
 * 快照），日志里列明；全部失败才非零退出（让 Actions 能看见）。
 *
 * 评测榜（eval）特殊：46 页、限流敏感，走独立节奏函数；2026-10-20 起与全站
 * 同为每轮（2 小时）重抓（110 分钟新鲜窗口只挡住 push/dispatch 紧挨着的重复轮）。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'web', 'public', 'assets', 'data');
const UA = 'trend-site/1.0 (https://github.com/shaowenchen/trending; contact: shaowenchen@users.noreply.github.com)';
const EVAL_SNAPSHOT_MS = 110 * 60 * 1000; // 与全站 2 小时节奏对齐（owner 2026-10-20）：评测榜也每轮重抓

const HF = 'https://huggingface.co/api';
const OR_FE = 'https://openrouter.ai/api/frontend/v1';
const OR_V1 = 'https://openrouter.ai/api/v1';
const EVAL_ENDPOINT = 'https://datasets-server.huggingface.co/rows';
const EVAL_DS = 'open-llm-leaderboard%2Fcontents';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 上游请求计数（含重试）：日志里如实报告"抓了几次、几个唯一端点"——
   once() 的去重效果靠这两个数说话（v1/models 被 4 个榜要，也只打 1 次）。 */
let reqCount = 0;
const reqUrls = new Set();

async function fetchOk(url, { headers = {}, timeout = 60_000, accept = 'application/json' } = {}) {
  reqCount += 1;
  reqUrls.add(url);
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept, ...headers },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function getJson(url, opts = {}) {
  const res = await fetchOk(url, opts);
  return res.json();
}

const ghHeaders = () =>
  process.env.GITHUB_TOKEN
    ? { headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } }
    : {};

const isoDaysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

/* ---------- 评测榜：分页 + 限流节奏（复刻前端 EVAL_FETCH 的实测校准值） ---------- */

async function fetchEvalPages() {
  const PAGE = 100;

  // 单页取数：普通失败短退避（800ms 起），429 长退避（25s×次数，桶回填约 60-70s）。
  // 第一页也走这条路 —— 它决定整块面板的去留，多给两次机会（firstAttempts=5）。
  const getPage = async (i, attempts) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await getJson(
          `${EVAL_ENDPOINT}?dataset=${EVAL_DS}&config=default&split=train&offset=${i * PAGE}&length=${PAGE}`,
          { timeout: 90_000 },
        );
      } catch (e) {
        const rateLimited = /429/.test(String(e.message));
        if (attempt >= attempts) throw e;
        await sleep(rateLimited ? Math.min(25_000 * attempt, 60_000) : 800 * 2 ** (attempt - 1));
      }
    }
  };

  const first = await getPage(0, 5);
  const total = Number(first?.num_rows_total) || 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  // 与前端 fetchAllEvalPages 同一形状：存"内层 row"（fullname / Average ⬆️ 等
  // 字段所在层），不存 datasets-server 的 {row_idx, row} 包装 —— normalizeEval
  // 只认内层，存了包装会让快照路径全行归零、静默回落直拉（10-20 实测教训）。
  const rows = [...(first?.rows ?? []).map((x) => x.row)];

  // 3 并发一批、批间 700ms；单页 3 次机会（含首次）
  for (let start = 1; start < pageCount; start += 3) {
    const batch = [];
    for (let i = start; i < Math.min(start + 3, pageCount); i++) {
      batch.push(getPage(i, 3).catch(() => null));
    }
    const parts = await Promise.all(batch);
    for (const part of parts) if (Array.isArray(part?.rows)) rows.push(...part.rows.map((x) => x.row));
    await sleep(700);
  }
  if (!rows.length) throw new Error('eval: 0 rows');
  return rows;
}

/* ---------- 榜定义：key → 取数函数（payload 原样给前端解析） ----------
 *
 * ★ 上游**每个端点只抓一次，扇出到多个分类**（owner 2026-10-20 要求）：
 * OpenRouter 的 6 个端点被 7 个榜共用（v1/models 被 4 个榜要、discovery 被 2 个
 * 榜要），`once()` 按端点名记忆化 —— 首次调用真抓，后来者直接复用同一个
 * Promise（失败也复用：不让 4 个榜各自重试，把同一端点打 4 遍）。
 * 与 momoyu（1 次聚合 API → 13 个 json）同一模式。
 */

const upstream = new Map(); // 端点名 → 进行中/已完成的 Promise
function once(name, fn) {
  if (!upstream.has(name)) {
    upstream.set(
      name,
      (async () => fn())().catch((e) => {
        // 失败也记忆：后续依赖同一端点的榜直接拿到同一个失败，不再重打上游
        upstream.set(name, Promise.reject(e));
        throw e;
      }),
    );
  }
  return upstream.get(name);
}

// OpenRouter 共用端点（6 个）
const orModels = () => once('or-models', () => getJson(`${OR_V1}/models`));
const orRankings = () => once('or-rankings', () => getJson(`${OR_FE}/rankings/models`));
const orDiscovery = () => once('or-discovery', () => getJson(`${OR_FE}/rankings/discovery`));
const orPerfRank = () => once('or-perf', () => getJson(`${OR_FE}/rankings/performance`));
const orBenchRank = () => once('or-benchmarks', () => getJson(`${OR_FE}/rankings/benchmarks`));
const orAppsRank = () => once('or-apps', () => getJson(`${OR_FE}/rankings/apps`));

const BOARDS = {
  trending: () => getJson(`${HF}/models?sort=trendingScore&direction=-1&limit=50`),
  liked: () => getJson(`${HF}/models?sort=likes&direction=-1&limit=50`),
  downloaded: () => getJson(`${HF}/models?sort=downloads&direction=-1&limit=50`),
  spaces: () => getJson(`${HF}/spaces?sort=trendingScore&direction=-1&limit=50`),
  datasets: () => getJson(`${HF}/datasets?sort=trendingScore&direction=-1&limit=50`),
  papers: () => getJson(`${HF}/daily_papers?limit=50`),
  newmodels: () => getJson('https://models.dev/api.json', { timeout: 120_000 }),
  swebench: () =>
    getJson(
      'https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json',
      { timeout: 120_000 },
    ),
  // Aider：上游是 YAML 文本，payload 存原文（前端有自己的最小 YAML 解析器）
  aider: async () => (await fetchOk(
    'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml',
    { accept: 'text/plain' },
  )).text(),
  // GitHub 新星榜：查询式与前端 GH_QUERIES.week 完全一致（created:>7 天前）
  repos: async () => {
    const q = `topic:llm created:>${isoDaysAgo(7)}`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
    return getJson(url, ghHeaders());
  },
  // ↓ OpenRouter 组：6 端点 × 7 榜，共用 once() 缓存
  openrouter: async () => [await orRankings(), await orModels()],
  orCatalog: orModels,
  orTrends: async () => [await orDiscovery(), await orModels()],
  orAuthors: orDiscovery,
  orPerf: orPerfRank,
  aaBench: orBenchRank,
  orApps: async () => [await orAppsRank(), await orModels()],
};

/* eval 不进 BOARDS 常规轮转：7 天窗口 + 限流节奏单独处理 */
async function evalRowsIfNeeded() {
  const file = path.join(DATA_DIR, 'eval.json');
  let fresh = false;
  try {
    const old = JSON.parse(await readFile(file, 'utf8'));
    fresh = Boolean(old?.fetchedAt && Date.now() - Date.parse(old.fetchedAt) < EVAL_SNAPSHOT_MS);
  } catch { /* 文件缺失/损坏 → 需要重抓 */ }
  if (fresh) return { key: 'eval', skipped: '110 分钟窗口内，本轮跳过' };
  const rows = await fetchEvalPages();
  return { key: 'eval', payload: rows };
}

/* ---------- 主流程 ---------- */

await mkdir(DATA_DIR, { recursive: true });

const results = [];
for (const [key, fn] of Object.entries(BOARDS)) {
  try {
    const payload = await fn();
    if (payload === undefined || payload === null) throw new Error('空响应');
    await writeFile(
      path.join(DATA_DIR, `${key}.json`),
      JSON.stringify({ key, name: key, fetchedAt: new Date().toISOString(), payload }, null, 1),
    );
    results.push(`OK   ${key} (${typeof payload === 'string' ? `${payload.length}B 文本` : Array.isArray(payload) ? `数组×${payload.length}` : '对象'})`);
  } catch (e) {
    results.push(`FAIL ${key}: ${e.message}（保留旧快照）`);
  }
}

try {
  const r = await evalRowsIfNeeded();
  if (r.payload) {
    await writeFile(
      path.join(DATA_DIR, 'eval.json'),
      JSON.stringify({ key: 'eval', name: 'eval', fetchedAt: new Date().toISOString(), payload: r.payload }, null, 1),
    );
    results.push(`OK   eval (${r.payload.length} 行原始数据)`);
  } else {
    results.push(`SKIP eval（${r.skipped}）`);
  }
} catch (e) {
  results.push(`FAIL eval: ${e.message}（保留旧快照）`);
}

console.log(results.join('\n'));
const okCount = results.filter((r) => r.startsWith('OK')).length;
const failCount = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n逐榜快照：成功 ${okCount} / 失败 ${failCount} / 跳过 ${results.length - okCount - failCount}｜上游 HTTP 请求 ${reqCount} 次 / 唯一端点 ${reqUrls.size} 个（once() 去重，OpenRouter 6 端点扇出 7 榜）`);
if (okCount === 0) process.exit(1);
