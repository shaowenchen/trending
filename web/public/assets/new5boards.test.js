#!/usr/bin/env node
/**
 * 2026-10-28 新增 5 榜的解析器测试。
 *
 * fixture 全部取自当日真实响应（只裁条数，字段逐字保留）。盯的是三处最容易
 * 静默坏掉的逻辑：
 *   · LMArena：rank 缺失时按 rating 兜底排序，rating 取整到 1 位；
 *   · 维基热词：非条目页（首页 / Special: / Wikipedia:）必须被剔除；
 *   · App Store：feed.results → 条目，缺 name/url 的剔除；
 *   · Terminal-Bench：RSC flight payload 的双重转义解析 + 结构变化时返回 null；
 *   · Product Hunt：tagline 从 content 的第一个 <p> 提取，票数不存在的处理。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeLmarena } from '../../../scripts/fetch-lmarena.mjs';
import { isArticleTitle, normalizeWikiTop } from '../../../scripts/fetch-wiki-top.mjs';
import { normalizeAppStore, RETRY_DELAYS } from '../../../scripts/fetch-appstore.mjs';
import { parseTbenchHtml } from '../../../scripts/fetch-tbench.mjs';
import { parseProductHunt } from '../../../scripts/fetch-producthunt.mjs';
import { flattenLmarena, flattenWikiTop, flattenAppStore, flattenTbench, flattenProductHunt } from './trend.js';

let pass = 0;
const t = (name, fn) => {
  try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

console.log('\n新增 5 榜的解析器测试（2026-10-28）');

/* ---------------- LMArena ---------------- */

t('★ normalizeLmarena：真实 first-rows → 条目（rank/rating/votes 取到）', () => {
  const json = { rows: [{ row: { model_name: 'Gemini 4 Argon (High)', organization: 'google', license: 'Proprietary', rating: 1525.7265, vote_count: 10083, rank: 1, category: 'overall' } }] };
  const rows = normalizeLmarena(json);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].model, 'Gemini 4 Argon (High)');
  assert.equal(rows[0].rating, 1525.7, 'rating 取整到 1 位');
  assert.equal(rows[0].votes, 10083);
  assert.equal(rows[0].org, 'google');
});

t('normalizeLmarena：缺 rank 时按 rating 降序；缺 model/rating 的剔除', () => {
  const rows = normalizeLmarena({ rows: [
    { row: { model_name: 'A', rating: 100 } },
    { row: { model_name: 'B', rating: 200 } },
    { row: { model_name: '', rating: 300 } },
    { row: { model_name: 'C' } },
  ] });
  assert.deepEqual(rows.map((r) => r.model), ['B', 'A'], '按 rating 降序，坏条目剔除');
  assert.equal(rows[0].rank, null, '没有 rank 就是 null，不编造');
});

t('flattenLmarena（trend.js 侧）：与抓取脚本同一套字段口径', () => {
  const rows = flattenLmarena({ items: [{ rank: 2, model: 'X', org: 'o', rating: 1200.456, votes: 5 }, { rank: 1, model: 'Y', rating: 1300 }] });
  assert.deepEqual(rows.map((r) => r.model), ['Y', 'X'], '按 rank 升序');
  assert.equal(rows[1].rating, 1200.5);
});

/* ---------------- Wikipedia top ---------------- */

t('★ isArticleTitle：首页/特殊页/名字空间页必须剔除', () => {
  for (const bad of ['Main_Page', 'Special:Search', 'Wikipedia:Featured_pictures', 'Portal:Current_events', 'File:Foo.jpg', 'Category:2026', 'Wikipedia:首页', '首页', 'メインページ']) {
    assert.equal(isArticleTitle(bad), false, `${bad} 不该算条目`);
  }
  for (const good of ['基利安·麥巴比', 'Python', '2026_Israeli_legislative_election']) {
    assert.equal(isArticleTitle(good), true, `${good} 应算条目`);
  }
});

t('normalizeWikiTop：过滤后保留下划线原文、限制条数、带语种标签', () => {
  const json = { items: [{ articles: [
    { article: 'Main_Page', views: 999 },
    { article: 'Python_(programming_language)', views: 100 },
    { article: 'Special:Search', views: 50 },
    { article: '习近平', views: 80 },
  ] }] };
  const rows = normalizeWikiTop(json, '中文维基');
  assert.deepEqual(rows.map((r) => r.title), ['Python (programming language)', '习近平'], '去掉导航页，下划线换空格');
  assert.equal(rows[0].lang, '中文维基');
  assert.equal(rows[0].views, 100);
});

t('flattenWikiTop：按浏览量降序，缺失 views 排最后', () => {
  const snap = { sources: [
    { name: '中文维基', items: [{ title: 'a', views: 10 }, { title: 'b', views: 30 }] },
    { name: '英文维基', items: [{ title: 'c', views: 20 }, { title: 'd', views: null }] },
  ] };
  assert.deepEqual(flattenWikiTop(snap).map((r) => r.title), ['b', 'c', 'a', 'd']);
});

/* ---------------- App Store ---------------- */

t('★ normalizeAppStore：feed.results → 条目；缺 name/url 剔除；rank 连续', () => {
  const json = { feed: { results: [
    { name: '抖音商城', artistName: 'Beijing Douyin', genres: [{ name: '购物' }], url: 'https://apps.apple.com/cn/app/id1', releaseDate: '2019-11-08' },
    { name: '', artistName: 'x', url: 'https://x' },
    { name: '红果短剧', artistName: 'ByteDance', genres: [{ name: '娱乐' }], url: 'https://apps.apple.com/cn/app/id2' },
  ] } };
  const rows = normalizeAppStore(json);
  assert.equal(rows.length, 2, '空名字剔除');
  assert.deepEqual(rows.map((r) => r.rank), [1, 2], 'rank 连续');
  assert.equal(rows[0].genres[0], '购物');
});

t('★ RETRY_DELAYS：App Store 端点偶发 502，必须有 ≥3 次重试', () => {
  assert.ok(RETRY_DELAYS.length >= 3, `重试次数 ${RETRY_DELAYS.length} 少于 3`);
  assert.ok(RETRY_DELAYS.every((d) => d > 0), '退避必须为正');
});

t('flattenAppStore：名称/开发者/分类/链接都在', () => {
  const rows = flattenAppStore({ items: [{ rank: 1, name: 'A', developer: 'D', genres: ['购物'], url: 'u' }] });
  assert.equal(rows[0].name, 'A');
  assert.equal(rows[0].developer, 'D');
  assert.deepEqual(rows[0].genres, ['购物']);
});

/* ---------------- Terminal-Bench ---------------- */

t('★ parseTbenchHtml：RSC flight payload（双重转义）能解析出 agent/score/trials', () => {
  // 真实形态：flight 参数是 **JS 字符串字面量**，其内容才是 JSON 文本 ——
  // 所以页面里看到的是 \" （两层），不是 \\\" （三层）。
  const flightText =
    '{"rows":' +
    JSON.stringify([
      { rank: 1, metadata: { agent_display: { label: 'Claude Code' }, model_display: { label: 'Opus 5.5' }, agent_org: { label: 'Anthropic' }, date: '2026-09-22' }, metrics: { accuracy: 64.85, n_trials: 330 } },
      { rank: 2, metadata: { agent_display: { label: 'Codex' }, model_display: { label: 'GPT-6' }, agent_org: { label: 'OpenAI' } }, metrics: { accuracy: 61.2, n_trials: 200 } },
    ]) +
    '}';
  const html = `<script>self.__next_f.push([1,${JSON.stringify(flightText)}])</script>`;
  const rows = parseTbenchHtml(html);
  assert.ok(rows, '应能解析');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].agent, 'Claude Code');
  assert.equal(rows[0].model, 'Opus 5.5');
  assert.equal(rows[0].score, 64.85, 'accuracy 已是百分数，不乘 100');
  assert.equal(rows[0].trials, 330);
});

t('★ parseTbenchHtml：页面结构变化时返回 null（调用方据此保留旧快照）', () => {
  assert.equal(parseTbenchHtml('<html>no data here</html>'), null);
  assert.equal(parseTbenchHtml('<script>self.__next_f.push([1,"x"])</script>'), null, '有 flight 但没有 rows');
  assert.equal(parseTbenchHtml(''), null);
});

t('parseTbenchHtml：没有 accuracy 的行剔除', () => {
  const flightText = '{"rows":' + JSON.stringify([{ rank: 1, metadata: { agent_display: { label: 'A' } }, metrics: {} }]) + '}';
  const html = `<script>self.__next_f.push([1,${JSON.stringify(flightText)}])</script>`;
  assert.deepEqual(parseTbenchHtml(html), []);
});

/* ---------------- Product Hunt ---------------- */

t('★ parseProductHunt：tagline 取 content 第一个 <p>，作者/时间/链接都在', () => {
  const xml = `<feed><entry>
    <id>tag:www.producthunt.com,2005:Post/1</id>
    <published>2026-10-27T23:46:15-07:00</published>
    <link rel="alternate" type="text/html" href="https://www.producthunt.com/products/opera"/>
    <title>WebAI by Opera</title>
    <content type="html">&lt;p&gt;Let websites use AI running on your computer&lt;/p&gt;&lt;p&gt;&lt;a href="x"&gt;Discussion&lt;/a&gt;&lt;/p&gt;</content>
    <author><name>Zac Zuo</name></author>
  </entry></feed>`;
  const rows = parseProductHunt(xml);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, 'WebAI by Opera');
  assert.equal(rows[0].tagline, 'Let websites use AI running on your computer', '只取第一段，不带 Discussion');
  assert.equal(rows[0].author, 'Zac Zuo');
  assert.ok(rows[0].url.startsWith('https://www.producthunt.com/'));
});

t('parseProductHunt：缺 title/link 的条目剔除；空输入不炸', () => {
  assert.deepEqual(parseProductHunt('<feed></feed>'), []);
  const rows = parseProductHunt('<feed><entry><title>只有标题</title></entry></feed>');
  assert.deepEqual(rows, [], '没有 link 的条目不该进榜');
});

t('flattenProductHunt：忠实转述，不编造热度数字', () => {
  const rows = flattenProductHunt({ items: [{ title: 'P', url: 'u', tagline: 't', author: 'a' }] });
  assert.equal(rows[0].title, 'P');
  assert.equal(rows[0].rank, 1);
  assert.ok(!('votes' in rows[0]), '不该凭空补一个 votes 字段');
});

/* ---------------- 门禁 ---------------- */

t('★ 五个新抓取脚本都有直跑守卫（import 不产生网络副作用）', () => {
  for (const f of ['fetch-lmarena.mjs', 'fetch-wiki-top.mjs', 'fetch-appstore.mjs', 'fetch-tbench.mjs', 'fetch-producthunt.mjs']) {
    assert.match(readFileSync(new URL(`../../../scripts/${f}`, import.meta.url), 'utf8'), /if \(isMain\)/, `${f} 缺直跑守卫`);
  }
});

console.log(`\n  通过 ${pass} 失败 ${process.exitCode ? 1 : 0}\n`);
