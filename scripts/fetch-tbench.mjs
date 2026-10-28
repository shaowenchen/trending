#!/usr/bin/env node
/**
 * Terminal-Bench 榜快照 —— `web/public/assets/data/tbench.json`。
 *
 * ## 这是什么榜
 * Terminal-Bench 衡量的是**在真实终端里把任务做完**的能力（装包、改配置、跑
 * 命令），测的是 agent 而不是裸模型。站内评测榜里它是唯一的"终端/运维"维度。
 *
 * ## 数据通路（为什么是"解析页面"而不是 API）
 * `www.tbench.ai` 没有公开 API，数据以 Next.js **RSC flight payload** 内嵌在
 * HTML 里：`self.__next_f.push([1,"…"])`，payload 内的 JSON 是**双重转义**
 * （`\\"`）。解析步骤：
 *   1. 整页把 `\"` 还原成 `"`（payload 原样是 HTML 里的转义串）；
 *   2. 找 `"rows":[` 并做括号配对切出数组；
 *   3. JSON.parse → 每行取 metadata.agent_display / model_display / metrics.accuracy。
 *
 * ## 失败语义（★ 任务书硬性要求）
 * 解析失败时**保留上一快照并告警** —— 不写文件、但也不让页面变空。
 *   页面改版导致结构变化时，这一条就是"线上仍有榜可看"的保险。
 *
 * ## 手动跑
 *   npm run snap:tbench
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/tbench.json'
);
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';
const PAGE_URL = 'https://www.tbench.ai/leaderboard';
const MIN_ITEMS = 3;

/**
 * 从页面 HTML 提取 leaderboard 行（导出给测试）。
 * 返回 null 表示"页面结构里找不到数据"（调用方据此保留旧快照）。
 */
export function parseTbenchHtml(html) {
  const raw = String(html ?? '');
  if (!raw.includes('__next_f')) return null;
  // flight payload 在 HTML 里是 \" 转义；还原后才是合法 JSON 文本
  const unescaped = raw.replace(/\\"/g, '"').replace(/\\n/g, '\n');
  const start = unescaped.indexOf('"rows":[');
  if (start === -1) return null;
  const arrStart = start + '"rows":'.length;
  let depth = 0;
  let slice = null;
  for (let i = arrStart; i < unescaped.length; i += 1) {
    const c = unescaped[i];
    if (c === '[') depth += 1;
    else if (c === ']') {
      depth -= 1;
      if (depth === 0) {
        slice = unescaped.slice(arrStart, i + 1);
        break;
      }
    }
  }
  if (!slice) return null;
  let rows;
  try {
    rows = JSON.parse(slice);
  } catch {
    return null;
  }
  if (!Array.isArray(rows)) return null;
  const out = [];
  for (const r of rows) {
    const md = r?.metadata || {};
    const metrics = r?.metrics || {};
    const agent = String(md?.agent_display?.label ?? '').trim();
    const model = String(md?.model_display?.label ?? '').trim();
    const acc = Number(metrics?.accuracy);
    if (!agent && !model) continue;
    if (!Number.isFinite(acc)) continue;
    out.push({
      rank: Number.isFinite(Number(r?.rank)) ? Number(r.rank) : out.length + 1,
      agent,
      model,
      org: String(md?.agent_org?.label ?? md?.model_org?.label ?? '').trim(),
      // 上游 accuracy 已是百分数（64.85 = 64.85%），**不乘 100**
      score: Math.round(acc * 100) / 100,
      trials: Number.isFinite(Number(metrics?.n_trials)) ? Number(metrics.n_trials) : null,
      date: String(md?.date ?? '').trim(),
    });
  }
  out.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
  return out;
}

async function main() {
  let html;
  try {
    const res = await fetch(PAGE_URL, {
      headers: { accept: 'text/html', 'user-agent': UA },
      signal: AbortSignal.timeout(30000),
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    console.error(`✗ 抓取失败：${e.message} —— 旧快照保留，不写文件`);
    process.exit(1);
  }

  const items = parseTbenchHtml(html);
  if (!items) {
    console.error('✗ 页面里没找到 leaderboard 数据（结构可能变了）—— 旧快照保留，不写文件');
    process.exit(1);
  }
  if (items.length < MIN_ITEMS) {
    console.error(`✗ 只解析出 ${items.length} 条（< ${MIN_ITEMS}）—— 旧快照保留，不写文件`);
    process.exit(1);
  }

  const snapshot = { fetchedAt: new Date().toISOString(), source: PAGE_URL, items };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  console.log(
    `✓ ${items.length} 条 · 榜首「${items[0].agent || items[0].model}」${items[0].score}% · 写入 ${path.relative(process.cwd(), OUT_PATH)}`
  );
}

if (isMain) await main();
