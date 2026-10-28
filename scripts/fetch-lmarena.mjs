#!/usr/bin/env node
/**
 * LMArena 竞技场榜快照 —— `web/public/assets/data/lmarena.json`。
 *
 * ## 这是什么榜
 * LMArena（原 Chatbot Arena）的**人类盲测 Elo**：两条匿名回复由真人投票比高下，
 * 累积成 rating。它衡量的是"用起来谁更讨喜"，与跑分型评测（eval / aaBench）
 * **不是同一件事** —— 这也是站内原来缺的那一块（模型榜里只有下载/热度，没有
 * 人类偏好）。
 *
 * ## 数据通路
 * `datasets-server.huggingface.co/first-rows?dataset=lmarena-ai/leaderboard-dataset`
 * 实测**带 Origin 时回显该 Origin 并允许凭证** → 浏览器可直连（`trend.js` 走
 * 直连优先），本脚本产出的快照是**兜底**：上游抽风或离线时页面仍有数据可看。
 * 字段：model_name / organization / license / rating / vote_count / rank / category。
 *
 * ## 口径
 *   只取 `config=text` 主榜（24 个子榜里的文本榜；多模态榜另行接入）；
 *   `rank` 用上游给的，不自己重排 —— 上游的并列处理有自己的规则。
 *
 * ## 失败语义
 * 抓不到 / 解析 < 5 条 → 非零退出、不写文件，旧快照保留。
 *
 * ## 手动跑
 *   npm run snap:lma
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/lmarena.json'
);
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';
const API_URL =
  'https://datasets-server.huggingface.co/first-rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=text&split=latest';
const MIN_ITEMS = 5;

/** rows → 标准条目（导出给测试） */
export function normalizeLmarena(json) {
  const rows = Array.isArray(json?.rows) ? json.rows : [];
  const out = [];
  for (const r of rows) {
    const row = r?.row || r;
    const model = String(row?.model_name ?? '').trim();
    const rating = Number(row?.rating);
    if (!model || !Number.isFinite(rating)) continue;
    out.push({
      rank: Number.isFinite(Number(row?.rank)) ? Number(row.rank) : null,
      model,
      org: String(row?.organization ?? '').trim(),
      license: String(row?.license ?? '').trim(),
      rating: Math.round(rating * 10) / 10,
      votes: Number.isFinite(Number(row?.vote_count)) ? Number(row.vote_count) : null,
      category: String(row?.category ?? '').trim(),
    });
  }
  // 上游 rank 可能缺失：以 rating 降序兜底
  out.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || b.rating - a.rating);
  return out;
}

async function main() {
  const res = await fetch(API_URL, {
    headers: { accept: 'application/json', 'user-agent': UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    console.error(`✗ 抓取失败：HTTP ${res.status}（旧快照保留，不写文件）`);
    process.exit(1);
  }
  const items = normalizeLmarena(await res.json());
  if (items.length < MIN_ITEMS) {
    console.error(`✗ 只解析出 ${items.length} 条（< ${MIN_ITEMS}，疑似结构变了）—— 旧快照保留`);
    process.exit(1);
  }
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    source: 'lmarena',
    category: 'text',
    items,
  };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  console.log(
    `✓ ${items.length} 条 · 榜首「${items[0].model}」${items[0].rating} 分 · 写入 ${path.relative(process.cwd(), OUT_PATH)}`
  );
}

if (isMain) await main();
