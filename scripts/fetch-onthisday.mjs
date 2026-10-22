#!/usr/bin/env node
/**
 * 历史上的今天（on this day）快照 —— 维基媒体 REST API → `web/public/assets/data/onthisday.json`
 * （中文站用）与 `onthisday-en.json`（英文站用）。
 *
 * ## 来源
 * `GET https://api.wikimedia.org/feed/v1/wikipedia/{zh|en}/onthisday/events/MM/DD`
 * （带注明联系方式的 UA —— wikimedia 的礼节要求；浏览器 fetch 设不了 UA，只能构建期抓）
 *
 * ## 口径
 * · 「今天」按 **Asia/Shanghai** 日期算（站点受众以中文区为主；Actions 的 cron 是 UTC，
 *   UTC 16:00 后就已经是北京的"明天"了，直接用 UTC 会错一天）。
 * · 每语言保留**带配图的事件**优先、至多 12 条（页面是"图文"卡片，无图事件价值低）；
 *   次序保持 API 返回序（大致按年代）。
 * · 每条裁剪成 {year, text, link, thumb, thumbTitle}：thumb 取该事件 pages 里第一张缩略图。
 * · 两语言都抓失败 → 非零退出、不写文件（与其它 fetch-* 脚本同一失败语义：宁可旧，不可错）。
 *
 * ## 手动跑
 *   npm run snap:onthisday
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const HERE = path.dirname(fileURLToPath(import.meta.url));

const UA = 'trend-site/1.0 (https://github.com/shaowenchen/trending; contact: shaowenchen@users.noreply.github.com)';
const MAX_EVENTS = 12;

/** 北京时间今天的 MM/DD */
function cstToday() {
  const now = new Date(Date.now() + 8 * 3600 * 1000); // UTC+8 固定偏移（中国无夏令时）
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return { m, d, iso: `${now.getUTCFullYear()}-${m}-${d}` };
}

async function fetchLang(lang, { m, d }) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/events/${m}/${d}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`${lang} → HTTP ${res.status}`);
  const data = await res.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  // 带图优先；同序保持
  const withImg = [];
  const noImg = [];
  for (const e of events) {
    const page = (e.pages || []).find((p) => p?.thumbnail?.source);
    const item = {
      year: e.year ?? null,
      text: (e.text || '').trim(),
      link: page?.content_urls?.desktop?.page || (e.pages || [])[0]?.content_urls?.desktop?.page || null,
      thumb: page?.thumbnail?.source || null,
      thumbW: page?.thumbnail?.width || null,
      thumbH: page?.thumbnail?.height || null,
      thumbTitle: page?.normalizedtitle || page?.title || null,
    };
    (item.thumb ? withImg : noImg).push(item);
  }
  return withImg.slice(0, MAX_EVENTS).concat(withImg.length >= MAX_EVENTS ? [] : noImg.slice(0, MAX_EVENTS - withImg.length));
}

/**
 * 繁→简转换：中文维基的 feed API 返回**繁體**（站内正文以繁體为主），
 * 而站点中文页是简体（owner 2026-10-20 要求：历史上的今天要随页面切换
 * **英文和简体中文**）。api.wikimedia.org 不认 `zh-cn` 变体（404），用
 * zh.wikipedia 的 action=parse + variant=zh-cn 逐条转换，剥掉 HTML 壳。
 * 单条失败就保留繁體原文 —— 繁體的真相好过没有事件。
 */
async function toSimplified(text) {
  if (!text) return text;
  try {
    const u = new URL('https://zh.wikipedia.org/w/api.php');
    u.searchParams.set('action', 'parse');
    u.searchParams.set('text', text);
    u.searchParams.set('variant', 'zh-cn');
    u.searchParams.set('contentmodel', 'wikitext');
    u.searchParams.set('prop', 'text');
    u.searchParams.set('disablelimitreport', '1');
    u.searchParams.set('format', 'json');
    u.searchParams.set('formatversion', '2');
    const res = await fetch(u, { headers: { 'User-Agent': UA, accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const html = data?.parse?.text || '';
    const m = /<p[^>]*>([\s\S]*?)<\/p>/.exec(html);
    const plain = (m ? m[1] : html)
      .replace(/<[^>]+>/g, '')      // 剥内层标签（事件文本偶尔带链接/斜体）
      .replace(/\s+/g, ' ')
      .trim();
    return plain || text;
  } catch {
    return text;
  }
}

async function main() {
  const today = cstToday();
  const out = {
    date: today.iso,          // 快照按哪个"今天"抓的（前端展示用）
    fetchedAt: new Date().toISOString(),
  };
  const failures = [];
  for (const [lang, file] of [['zh', 'onthisday.json'], ['en', 'onthisday-en.json']]) {
    try {
      let events = await fetchLang(lang, today);
      if (!events.length) throw new Error(`${lang} 空事件列表`);
      if (lang === 'zh') {
        // 繁→简（见 toSimplified 注释）；串行 + 150ms 间隔，对 wiki API 礼貌一点
        for (const e of events) {
          e.text = await toSimplified(e.text);
          if (e.thumbTitle) e.thumbTitle = await toSimplified(e.thumbTitle);
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      const target = path.resolve(HERE, '../web/public/assets/data', file);
      await fs.writeFile(target, JSON.stringify({ ...out, lang, events }, null, 1) + '\n');
      console.log(`✓ ${lang} · ${events.length} 条（带图 ${events.filter((e) => e.thumb).length}）· ${today.iso} → ${file}`);
    } catch (e) {
      failures.push(e.message);
    }
  }
  if (failures.length === 2) {
    console.error(`✗ 两语言都失败：${failures.join(' / ')} —— 旧快照保留`);
    process.exit(1);
  }
  if (failures.length) console.error(`  ⚠ ${failures.join(' / ')}（另一语言成功，照常发布）`);
}

if (isMain) await main();
