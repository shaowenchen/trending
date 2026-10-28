#!/usr/bin/env node
/**
 * Product Hunt 今日新品快照 —— `web/public/assets/data/producthunt.json`。
 *
 * ## 这是什么榜
 * Product Hunt 的当日新品流（Atom feed，50 条）。它回答的是"今天有什么新产品
 * 被做出来"—— 站内其它榜要么是模型/评测，要么是热榜，没有"新产品发布"这个维度。
 *
 * ## 数据通路
 * `https://www.producthunt.com/feed` 实测 200 + `application/atom+xml`，无 CORS
 * → 构建期快照。
 *
 * ## 一个如实说明
 * 这个 feed **没有 votes/count 字段**（只有 id / published / link / title /
 * content / author）。所以面板上不给"票数"列，只给标题 + 一句话简介 + 作者 ——
 * 硬造一个热度数字比不显示更糟。
 *   · 一句话简介从 `<content type="html">` 的第一段 `<p>` 提取（实体已解码）；
 *   · 列表按 `published` 倒序（feed 本身即倒序，显式排序防止上游改序）。
 *
 * ## 失败语义
 * 抓不到 / 解析 < 5 条 → 非零退出、不写文件，旧快照保留。
 *
 * ## 手动跑
 *   npm run snap:producthunt
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../web/public/assets/data/producthunt.json'
);
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 trend-snapshot/1.0';
const FEED_URL = 'https://www.producthunt.com/feed';
const LIMIT = 30;
const MIN_ITEMS = 5;

const unescape = (s) =>
  String(s ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** atom → 标准条目（导出给测试） */
export function parseProductHunt(xml, limit = LIMIT) {
  const out = [];
  const entries = String(xml ?? '').match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  for (const e of entries.slice(0, limit)) {
    const title = unescape(/<title[^>]*>([\s\S]*?)<\/title>/.exec(e)?.[1] || '').replace(/\s+/g, ' ').trim();
    const url = /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/.exec(e)?.[1] ||
      /<link[^>]*href="([^"]+)"/.exec(e)?.[1] || '';
    if (!title || !url) continue;
    const content = unescape(/<content[^>]*>([\s\S]*?)<\/content>/.exec(e)?.[1] || '');
    // 简介 = content 里第一个 <p> 的文字（第二个 <p> 是 Discussion/Link 导航）
    const firstP = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(content)?.[1] || '';
    const tagline = unescape(firstP.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const author = unescape(/<name>([\s\S]*?)<\/name>/.exec(/<author>([\s\S]*?)<\/author>/.exec(e)?.[1] || '')?.[1] || '').trim();
    out.push({
      title,
      url,
      tagline: tagline.length > 160 ? `${tagline.slice(0, 157)}…` : tagline,
      author,
      time: /<published>([\s\S]*?)<\/published>/.exec(e)?.[1]?.trim() || '',
    });
  }
  out.sort((a, b) => Date.parse(b.time || 0) - Date.parse(a.time || 0));
  return out;
}

async function main() {
  const res = await fetch(FEED_URL, {
    headers: { accept: 'application/atom+xml, application/xml, text/xml, */*', 'user-agent': UA },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    console.error(`✗ 抓取失败：HTTP ${res.status}（旧快照保留，不写文件）`);
    process.exit(1);
  }
  const items = parseProductHunt(await res.text());
  if (items.length < MIN_ITEMS) {
    console.error(`✗ 只解析出 ${items.length} 条（< ${MIN_ITEMS}）—— 旧快照保留，不写文件`);
    process.exit(1);
  }
  const snapshot = { fetchedAt: new Date().toISOString(), source: FEED_URL, items };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(snapshot, null, 1) + '\n');
  console.log(`✓ ${items.length} 条 · 最新「${items[0].title}」· 写入 ${path.relative(process.cwd(), OUT_PATH)}`);
}

if (isMain) await main();
