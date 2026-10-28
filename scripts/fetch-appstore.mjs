#!/usr/bin/env node
/**
 * App Store 中国区免费榜快照 —— `web/public/assets/data/appstore.json`。
 *
 * ## 这是什么榜
 * Apple 官方 marketing tools RSS 的**中国区免费 App 榜**（25 条）。它给的是
 * "中国大陆用户此刻在装什么"—— 与站内其它榜的维度都不同：既不是开发者用量
 * （OpenRouter / PyPI 系），也不是话题热度，而是**真实下载行为**。
 *
 * ## 数据通路
 * `rss.applemarketingtools.com/api/v2/cn/apps/top-free/25/apps.json`
 * 实测**无 CORS** → 只能构建期快照。
 * ★ 该端点会**偶发 502**（Apple 侧边缘节点抖动）—— 所以抓取带重试，
 *   退避 2s / 5s / 10s，累计 4 次尝试；仍失败才非零退出（旧快照保留）。
 *
 * ## 口径
 *   只收 name / artistName / genres / url / artwork；**不收图标 URL**（页面不加载
 *   第三方图片，与站内取向一致，也免得页面上线后一堆 404）。
 *
 * ## 手动跑
 *   npm run snap:appstore
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/appstore.json'
);
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';
const API_URL = 'https://rss.applemarketingtools.com/api/v2/cn/apps/top-free/25/apps.json';
/** 重试退避（毫秒）：共 4 次尝试 */
export const RETRY_DELAYS = [2000, 5000, 10000];
const MIN_ITEMS = 5;

/** feed → 标准条目（导出给测试） */
export function normalizeAppStore(json) {
  const results = Array.isArray(json?.feed?.results) ? json.feed.results : [];
  const out = [];
  for (const r of results) {
    const name = String(r?.name ?? '').trim();
    const url = String(r?.url ?? '').trim();
    if (!name || !url) continue;
    out.push({
      rank: out.length + 1,
      name,
      developer: String(r?.artistName ?? '').trim(),
      genres: (Array.isArray(r?.genres) ? r.genres : []).map((g) => String(g?.name ?? g ?? '')).filter(Boolean),
      releaseDate: String(r?.releaseDate ?? '').trim(),
      url,
    });
  }
  return out;
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': UA },
        signal: AbortSignal.timeout(25000),
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < RETRY_DELAYS.length) {
        const wait = RETRY_DELAYS[attempt];
        console.warn(`  ! 第 ${attempt + 1} 次失败（${e.message}）—— ${wait / 1000}s 后重试`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr || new Error('抓取失败');
}

async function main() {
  const json = await fetchWithRetry(API_URL);
  const items = normalizeAppStore(json);
  if (items.length < MIN_ITEMS) {
    console.error(`✗ 只解析出 ${items.length} 条（< ${MIN_ITEMS}）—— 旧快照保留，不写文件`);
    process.exit(1);
  }
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    storefront: 'cn',
    title: String(json?.feed?.title || '').trim(),
    items,
  };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  console.log(`✓ ${items.length} 条 · 榜首「${items[0].name}」· 写入 ${path.relative(process.cwd(), OUT_PATH)}`);
}

if (isMain) await main();
