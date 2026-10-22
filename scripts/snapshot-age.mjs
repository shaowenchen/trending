#!/usr/bin/env node
/**
 * 快照"是否该刷新"的判断 —— 给 CI 用，也给人看。
 *
 * ## 为什么需要它（2026-10-20 的真实故障）
 * 工作流原来只在 `schedule` / `workflow_dispatch` 时刷快照，push 只部署。
 * 但 GitHub 的 cron **不保证准点，负载高时整次触发会被丢掉** —— 实测
 * `23 * {}` 的节奏连丢三轮（00:23 / 02:23 / 04:23Z 全无运行），页面上
 * 于是拿的是一份 4 小时前的快照，`抓取于 08:00` 一直不动。
 *
 * 所以刷新条件改成"**数据够旧就刷**"，而不是"只有定时任务才刷"：
 *   · 定时触发的正常路径不变（每 2 小时一次）；
 *   · 任何一次 push 都成了兜底 —— cron 被丢时，下一次推代码就把旧数据补上；
 *   · 数据新鲜时 push **什么都不做**，不会叠着打上游（这是 owner 要的）。
 * 这条同时把"刷新 → 提交 → push → 又触发布署"这条链断在第二次：第二轮
 * 看到的是刚写进去的新时间戳，直接跳过，不会自我循环。
 *
 * ## 口径：取所有快照里**最新**的 fetchedAt
 * 它回答的是"这条流水线上一次成功抓取是什么时候"，正好是要判断的东西。
 * 不能用最早的那个：不同上游的时间戳来源不同（微博等用站方 create_time，
 * 本来就可能落后几小时），拿它当准会每一轮都判"该刷"。
 *
 * ## 分组（2026-10-21）：热榜与重榜分开判龄
 * 不同榜的"该多新"差着量级：微博/抖音这类分钟级热榜，2 小时一刷就是"慢"；
 * 而 eval（46 页限速拉取）/ swebench（4MB）/ HF 全量每 15 分钟打一次上游是骚扰。
 * 所以支持 `--group fast|slow`：
 *   · fast —— 只看 cn-hot.json + video-boards.json（momoyu 15 榜 + 抖音/小红书），
 *     阈值 20 分钟；
 *   · slow —— 其余全部快照，阈值 120 分钟；
 *   · 不带参数 —— 全部快照、90 分钟（`npm run snap:age` 的人工口径，行为不变）。
 * 输出：`stale=true|false` 写进 `$GITHUB_OUTPUT`（本地跑时只打印），
 * 并以退出码 0 表示"需要刷新"、1 表示"还新鲜" —— 方便 `if:` 之外的地方用。
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendFileSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import { HOT_LIST_KEYS } from '../web/public/assets/trend.js';
import { BOARDS as VIDEO_BOARDS } from './fetch-video-boards.mjs';

const DATA_DIR = path.join(ROOT, 'web', 'public', 'assets', 'data');

/**
 * 判"旧"的阈值。定时任务每 2 小时一次，所以：
 *   · 90 分钟 —— 踩在两次正常刷新之间；正常路径不会触发它（上一轮刚抓过），
 *     只有"漏了一轮"才会变陈旧。留 30 分钟余量给 cron 的常见延迟。
 *   · 可用 `SNAP_MAX_AGE_MINUTES` 覆盖（应急时临时调小/调大）。
 */
const MAX_AGE_MIN = Number(process.env.SNAP_MAX_AGE_MINUTES || 90);

// ── fast 组的文件清单：**从两个 fast 脚本的导出推导**（单一真值）──
// 新增拆分文件（比如 momoyu 加源）时，改 trend.js 的 HOT_LIST_KEYS /
// fetch-video-boards 的 BOARDS，这里的清单自动跟上 —— 不然新文件会掉进
// slow 组污染判龄（慢组的"最新文件年龄"被它压成 0，snap:slow 永远不触发，
// 2026-10-21 实测踩过）。
const FAST_FILES = [
  'cn-hot.json',                       // fetch-momoyu-hot（聚合）
  'video-boards.json',                 // fetch-video-boards（聚合）
  ...HOT_LIST_KEYS.map((k) => `${k}.json`),        // momoyu 13 榜拆分
  ...VIDEO_BOARDS.map((b) => `${b.key}.json`),     // 抖音/小红书拆分
];

/** 分组定义：组名 → [文件清单, 阈值分钟]。fast = 分钟级热榜；slow = 其余全部。 */
const GROUPS = {
  fast: { files: FAST_FILES, maxAge: Number(process.env.SNAP_FAST_MAX_AGE_MINUTES || 10) },
  slow: { files: null, maxAge: Number(process.env.SNAP_SLOW_MAX_AGE_MINUTES || 120) }, // null = 除 fast 外全部
};

const args = process.argv.slice(2);
const groupArg = args.includes('--group') ? args[args.indexOf('--group') + 1] : null;
if (groupArg && !GROUPS[groupArg]) {
  console.error(`未知分组：${groupArg}（可用：${Object.keys(GROUPS).join(' / ')}）`);
  process.exit(2);
}
const GROUP = groupArg ? GROUPS[groupArg] : null;
const maxAge = GROUP ? GROUP.maxAge : MAX_AGE_MIN;

/** 指定文件集合里最新的 fetchedAt（= 上一次成功抓取的时刻），没有/全坏返回 null */
const now = Date.now();
async function latestFetchedAt() {
  let newest = null;
  let files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  if (GROUP) {
    files = GROUP.files ? files.filter((f) => GROUP.files.includes(f)) : files.filter((f) => !GROUPS.fast.files.includes(f));
  }
  for (const f of files) {
    try {
      const j = JSON.parse(await readFile(path.join(DATA_DIR, f), 'utf8'));
      const t = Date.parse(j?.fetchedAt ?? '');
      // 未来时刻 = 时区解析事故（站方时刻没带时区之类），不能让它把 age 压成
      // 负数、把整组判成"永远新鲜"—— 直接不参与计算
      if (Number.isFinite(t) && t <= now + 5 * 60000 && (newest === null || t > newest)) newest = t;
    } catch {
      // 坏文件不参与判断：读不出来的是"不知道"，不该被当成"很旧"
    }
  }
  return newest;
}

const newest = await latestFetchedAt();
const ageMin = newest === null ? Infinity : Math.round((now - newest) / 60000);
const stale = newest === null || ageMin > maxAge; // ★ 分组阈值（上一版只改了显示、没改判定——31>20 却判'新鲜'）

const when = newest === null ? '没有任何可读快照' : `${new Date(newest).toISOString()}（${ageMin} 分钟前）`;
console.log(`快照最新时刻：${when}`);
console.log(`判定：${stale ? '需要刷新' : '仍然新鲜'}（${groupArg ? `组 ${groupArg} · ` : ''}阈值 ${maxAge} 分钟）`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `stale=${stale}\nage_minutes=${ageMin}\n`);
} else if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `快照最新时刻：${when}\n\n判定：${stale ? '需要刷新' : '仍然新鲜'}\n`);
}

process.exit(stale ? 0 : 1);
