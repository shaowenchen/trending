# 迭代日志（dsh 会话断点文档）

> 约定：每个会话/回合把进度落到这里，重启后按文件接上，不依赖会话上下文。

## 2026-10-22 · 一级分类支持点击折叠

- `nav.js`：组头 `.idx-group-head` 从 div 改为 `<button data-idx-toggle aria-expanded>`，
  组上加 `data-topic`（折叠状态的键）；组名 span 的 HTML 保持不变（测试按它断言）。
- `trend.js`：`trend-idx-collapsed` 存 localStorage（刷新保持）；`applyCollapse()`
  同步 class 与 aria-expanded；document 上委托点击切换。
- `site.css`：`.idx-group.collapsed .idx-group-items { display:none }`；竖排形态
  组头带折叠箭头（右转/下转）；561–1023 横滑条里组头 `pointer-events:none`、
  不出箭头（横条里折叠没有意义）。
- 验证：PC 点击收起/刷新保持/再点展开、localStorage 同步；手机 390 展开面板里
  折叠"中文热榜"生效（15 个榜片收起）；800px 横滑条组头不可点。

## 2026-10-22 · dev 历史压成单提交 + README 与 master 对齐 + 提交规范

- dev 的 README 改成与 master 完全相同（`# trending`）。**
- dev 历史由 ~200 条压成 **1 条**（孤儿提交，`Initial commit`），强制推送；
  pages 分支（发布物）不受影响，推送后部署成功。
- **提交规范（owner 要求）**：commit message **一律英文、简短**，不写大段说明；
  需要解释的细节写进本文件或代码注释，不塞进 commit。

## 2026-10-22 · 首页那句描述从页面/标题/meta 全部去掉

用户："39 个榜单收进一个页面 —— 模型热度、开源生态、评测表现、AI 资讯与中文热榜。
这段文字去掉"

三处一起清（只删可见行会在源码/标签页里留尾巴）：

1. 可见描述行 `<p class="home-sub">` + 相关 CSS（上一轮已做）；
2. `<title>`：回到纯品牌词（`趋势大盘` / `Trend boards`）；
3. `<meta name="description">`：换回不含该句的简短说明。

同步：site.test.js 的标题门禁不再要求含描述短语（改回"以品牌词开头 + 无占位符"）。

### 验收

- [x] 发布物里该句 0 处（中英两页）；212 测试全绿。
- [x] 推 dev → 部署 → 线上复核。

## 2026-10-22 · 删掉首页标题下的描述行

用户："39 个榜单收进一个页面 —— 模型热度、开源生态、评测表现、AI 资讯与中文热榜。
这段文字去掉"

- 中英两页的 `<p class="home-sub">…</p>` 与站点描述 CSS（基础 + 宽屏两处）一并移除；
- 正文现在从分栏直接开始（layoutTop 63px），页头左侧 h1 是唯一的品牌/标题；
- 发布物里无 `home-sub` 残留，212 测试全绿。

### 验收

- [x] 无头实测中英页：无描述行、正文无该句、布局从 63px 开始。
- [x] 推 dev 触发部署后线上复核。

## 2026-10-22 · 工作流移回 dev，master 只剩一行 README

用户："master上也不要action，放到dev上去"

### 终版结构

| 分支 | 内容 | 触发 |
|---|---|---|
| `master`（默认） | 仅 `README.md`（一行 `# trending`），**无任何工作流** | — |
| `dev` | 全部源码 + `.github/workflows/pages.yml` | push dev / dispatch / schedule |
| `pages` | 构建产物（孤儿单提交强推） | Pages 从这里发布 |

- 推 dev 即构建发布；bot 的快照提交（push 到 dev）用 `github.actor != 'trend-bot'`
  挡掉，不重复部署。
- `dispatch-refresh.sh` 的 ref 改回 `dev`（本机 crontab 每 15 分钟兜底）。
- ★ **GitHub 的 cron 不会注册了**：定时触发只从默认分支的工作流注册，而
  master 上没有工作流。数据刷新现在靠：①本机 crontab 的 dispatch（机器常开）
  ②任何 push dev 顺带判龄补刷。工作流里的 `schedule` 段保留（默认分支若改回
  dev 会自动生效）。

### 验收

- [x] master 树 = 仅 README.md；默认分支仍 master。
- [x] push dev → `Deploy to GitHub Pages` success → pages 重建 → 线上 200、
      数据 4 分钟前。
- [x] dev 上工作流存在、master 上不存在。

## 2026-10-22 · 分支终版：master 默认（README + 部署工作流）/ dev 开发 / pages 产物

用户："readme的内容还是太多了，github上的默认分支master，开发dev，
开发完成跑actions部署到pages"

### 结构

| 分支 | 内容 | 说明 |
|---|---|---|
| `master`（默认） | README（两行）+ `.github/workflows/pages.yml` | 工作流必须住默认分支：GitHub 的 cron 只从默认分支注册 |
| `dev` | 全部源码与迭代 | 推送不再自动部署 |
| `pages` | 构建产物 | 孤儿单提交强推，Pages 从它发布 |

- master 的 README 精简为两行（`# trending` + 一句话），提交信息 `Initial commit`。
- master 的工作流：**检出 dev** → 分组判龄刷新 → 测试 → 构建 → 推 pages。
  触发：`workflow_dispatch`（开发完成后手动跑）+ `schedule`（15 分钟数据刷新，
  cron 靠默认分支才活着）。
- dev 的旧工作流删除（单一来源），`dispatch-refresh.sh` 的 ref 改 master。

### 验收

- [x] 默认分支 = master；仓库首屏只有两行 README；工作流在 Actions 页可见。
- [x] 手动 dispatch（master）→ success → pages 重建 → 线上 /trending/ 200，
      中英文页与数据正常。
- [x] dev 推送已不再触发部署（符合"开发完成才发布"）。

## 2026-10-22 · master 收敛为 README、默认分支切 dev

用户："再清理一下master分支就可以了"

补齐分支模型：master 只留 README，默认分支切 dev。

1. **master 重写为孤儿单提交**：只有一份 README（项目占位 + 分支指引 + 线上
   地址）。用 `hash-object` + `mktree` + `commit-tree` 直接造提交，不动工作区；
   强推覆盖。全量历史仍在 dev。
2. **默认分支切到 dev**（GitHub 只从默认分支的 workflow 注册 cron 排程）。
3. 本地删掉指向旧 master 的本地分支（远端已重写）。

### 现有分支

| 分支 | 内容 |
|---|---|
| `dev`（默认） | 源码 + 迭代 + 工作流 + 定时刷新 |
| `master` | 项目说明（README） |
| `pages` | 构建产物（CI 每次孤儿单提交强推，Pages 从它发布） |

### 验收

- [x] master 根目录 = 仅 README.md；默认分支 = dev。
- [x] 线上 /trending/ 200（pages 分支发布不受影响）。

## 2026-10-22 · 分支模型：master = 初始化 README 门面，dev = 真实迭代 + 部署来源

用户："更新一下项目下的文档，主分支仅仅写入一个初始化的空项目readme，
将真正迭代的分支放在dev"

### 做了什么

1. `dev` 分支从当前 master（全量代码 + 历史）建立 —— **后续迭代都在 dev**。
2. workflow 触发分支 `[main, master]` → `[dev]`；dispatch-refresh.sh 的
   dispatch ref `master` → `dev`；README / docs/deploy.md 同步分支说明。
3. master 重写为**孤儿初始化提交**：只有一份 README（项目介绍 + 分支指引 +
   线上地址），force-push 覆盖 —— 全量历史仍在 dev（本仓库克隆亦有）。
4. **默认分支切到 dev**（关键：GitHub 只从默认分支的 workflow 注册 cron 排程
   —— master 变成 README 门面后，排程必须住在 dev 上，否则 15 分钟刷新停摆）。
5. 本地仓库：checkout dev 跟踪 origin/dev；本地 master 删除（避免双头混淆）。
   （顺带把日志文件丢失的总标题补回。）

### 验收

- [x] dev push 触发的运行成功并部署（线上 /trending/ 200）。
- [x] 默认分支 = dev；master 在 GitHub 上只剩 README。
- [x] 本机 dispatch（crontab）ref 已指 dev。

## 2026-10-22 · 旧仓库 shaowenchen/trend 已删除

owner 确认切换后删除了旧仓库（API/网页/旧站点 /trend/ 均 404）。
迁移时 trending 已包含全部历史（截至 26eb7fd 的 58+ 提交），旧仓库此后唯一
独有的一笔是"停用定时刷新"的配置变更（3d35301，对 trending 无意义）——
无数据损失。本机 `~/Documents/code/trend` 目录保留作本地归档（含该笔提交），
owner 可自行删除。后续只迭代本仓库。

### 现状

- 站点：www.chenshaowen.com/trending/（自定义域名用户级配置自动继承）
- 刷新：cron 每 15 分钟（fast 阈值 10 分钟 / slow 120 分钟）+ 本机 crontab
  兜底 dispatch（scripts/dispatch-refresh.sh）
# 迭代日志（dsh 会话断点文档）

> 约定：每个会话/回合把进度落到这里，重启后按文件接上，不依赖会话上下文。

## 2026-10-22 · 仓库迁移：trend → trending（路由 /trend/ → /trending/）

用户："帮我将全部代码和部署同步到code/trending仓库下，我需要切换一下路由到 /trending 路径下"

### 迁移内容

1. 本机 `code/trending`（owner 预建好的空仓库）fetch 旧仓库全量历史 → master
   （58+ 提交，含全部快照数据），origin 指向 shaowenchen/trending。
2. 适配：8 处硬编码仓库 slug（dispatch-refresh.sh / 各 fetch 脚本的 UA /
   docs/deploy.md）trend → trending。
3. GitHub Pages 已用 API 启用（build_type=workflow）—— 自定义域名是
   用户级配置，自动带过来：站点落在 **www.chenshaowen.com/trending/**。
4. 首次 push 触发的运行已成功部署，线上验证：首页 200（标题正确）、
   数据 JSON 200、trend.js 含搜索/Hash 路由新功能。
5. 本机 crontab 的兜底触发器已切到 `code/trending/scripts/dispatch-refresh.sh`。
6. **旧仓库 shaowenchen/trend**：停用定时触发（避免两个仓库 15 分钟一档重复打
   上游）；站点 /trend/ 仍在但数据冻结在迁移时刻；push/manual 能力保留。
   如需彻底下线，archive 或删仓库由 owner 决定。

### 验收

- [x] 新仓库 CI 首跑成功并部署；www.chenshaowen.com/trending/ 全链路 200。
- [x] 212 条测试全绿（迁移前跑过）。
- [x] 旧仓库 schedule 已停（push 触发的运行可见）。
## 2026-10-21 · 第二十四轮：榜单内搜索回归

用户："榜单搜索的功能加上了么"

### 现状确认

过滤逻辑一直都在（`applyBoardState` 的 q / searchFields + 120ms 防抖绑定 + 测试），
但第十一轮简化时把**输入框**随控件区一起删了 —— `data-q` 在发布物里出现 0 次，
绑定成了死代码。

### 做了什么

1. `mountBoard` 渲染 `.board-search` 一行（面板头与列表之间）：放大镜图标 +
   输入框（placeholder 沿用各榜现成的 `cfg.placeholder`）+ 命中数 + 清除按钮；
   无 searchFields 的榜不渲染。
2. 命中数放**搜索行右侧**（"N 条命中"），底部行保持只有"数据更新于"
   （第二十二轮 owner 的要求不破坏）；清除后焦点还给输入框。
3. `ui.js` 加 `search` 放大镜图标（与既有内联 SVG 同一套 stroke 风格）；
   i18n 加 `ui.hitCount` / `ui.clear`（中英两份）；CSS `.board-search`
   （浅底无边框，与"扁平去框"取向一致；手机 390 宽 334px 无横向滚动）。

### 验收

- [x] `npm test` 212 条全绿。
- [x] 无头实测：搜索框存在（占位"按标题或来源搜索…"）；搜"AI" → 50 行滤成 3 行
      + "3 条命中" + 清除按钮出现；点清除 → 恢复 50 行、输入框清空、焦点返还；
      手机 390 无横向滚动。
- [x] push 后线上实测。
## 2026-10-21 · 第二十三轮：Action 失败排查——GitHub 服务端 push 瞬时错误

用户："action失败了，看看什么原因"

### 根因（07:15Z 那次 workflow_dispatch）

- fast 刷新**成功**（momoyu 13 榜 + 抖音/小红书都刷了）、bot 提交也成功；
- push 时 GitHub 服务端报 **`fatal error in commit_refs`** → remote rejected ——
  **服务端瞬时故障**，不是我们的代码/数据问题。刷好的 15 份数据丢在 runner 里。
- 另：slow 判龄步骤的红色 `##[error]` 是**噪声**（退出码 1 = "仍新鲜"是约定语义，
  continue-on-error 已兜住），不影响结果。

### 修复

bot 提交步骤的 push 加**指数退避重试**（10s/20s/30s 三次）——瞬时错误重试即过；
真失败（如非快进）仍会如实暴露。

### 验收

- [x] 重试逻辑上线后首跑成功：snap 提交（07:19Z）+ 部署，线上 cn-hot/douyin
      数据年龄 1 分钟。
## 2026-10-21 · 第二十二轮："都更新了吗"——分组判龄的判定 bug 与排程兜底

用户："都更新了吗"

### 审计发现（两真一假）

1. **★ 判定 bug（真）**：第二十一轮改分组时只改了**显示**的阈值，
   `stale` 计算还在用老的 90 分钟 —— 日志里"阈值 20 分钟"是假的，
   31 分钟的 fast 数据被判"仍然新鲜"，15 分钟节奏整个失效。
   修：`stale = ageMin > maxAge`（分组阈值）。
2. **★ 慢组判龄被污染（真）**：momoyu/uapis 的**逐榜拆分文件**每 15 分钟被
   fast 刷新，但 fast 清单只列了两个聚合文件 → 拆分文件落进 slow 组，
   把慢组"最新文件年龄"压成 0 → snap:slow 永远不触发。
   修：fast 清单从 `HOT_LIST_KEYS` / `VIDEO_BOARDS` 推导（单一真值）。
3. **新 cron 排程未注册（假警报）**：新 cron push 后 2 小时无 schedule 事件
   （GitHub 注册延迟）。兜底：①任何 push 触发的运行都会判龄补刷；
   ②**本机兜底触发器** `scripts/dispatch-refresh.sh`（crontab 每 15 分钟）：
   线上数据 >12 分钟才 dispatch（CI 分组判龄决定刷什么），凭据 git credential
   现取现用不落盘。这台机器常开，排程注册好了它也只在数据过期时才动作。
4. 顺带：bot 提交步骤加 `git pull --rebase`（owner 并发 push 撞过一次非快进，
   刷好的数据白丢）；snapshot-age 忽略"未来时刻"（时区解析事故不再能掩盖整组）。

### 验收

- [x] `snapshot-age --group fast` 本地：39 分钟 > 20 → 需要刷新（修复前 31>20 判"新鲜"）。
- [x] `npm test` 212 条全绿。
- [x] 线上实测：cn-hot / eval 全部回到分钟级新鲜。
## 2026-10-21 · 第二十一轮：热榜刷新提速（2 小时 → 15 分钟，分组判龄）

用户："momoyu.cc 的数据更新很快，你比较一下，我们的怎么那么慢"

### 对比（实测数字）

- momoyu 自己的爬虫：**6 分钟前**刚抓过（动态站实时读自己的库）；
- 我们的 cn-hot 快照：停在 **163 分钟前**（2 小时 cron）；
- 差距全在刷新节奏 —— momoyu 无 CORS（实测无 access-control 头），浏览器直连
  做不了，静态站只能靠构建期快照追，节奏就是上限。
- 附带发现：juejin 块在 **momoyu 自己那边就是 21 小时没动**（站方对部分源
  只在榜单变化时才更新）—— 我们的 21 小时是如实转述，不是我们的锅；
  底部"数据更新于"用的站方时刻，读得到这个差别。

### 改动

1. **cron 每 2 小时 → 每 15 分钟**（`13,28,43,58 * * * *`，躲开整点拥挤）。
2. **分组判龄**（`snapshot-age.mjs --group fast|slow`）：
   - fast = cn-hot.json + video-boards.json（momoyu 15 榜 + 抖音/小红书），
     阈值 20 分钟 —— 热榜最坏滞后 15–20 分钟（此前 0–2 小时）；
   - slow = 其余全部（eval 46 页 / swebench 4MB / HF / OpenRouter…），
     阈值 120 分钟不变 —— 重榜 15 分钟打一次上游是骚扰。
3. `snap:fast` / `snap:slow` 两个新脚本组；`snap:all` 不变（人工全量）。
4. **trend-bot 的快照提交不再触发第二次部署**（build job 加 actor 条件）：
   新数据已随定时运行构建发布，否则每 15 分钟要跑两遍（96×2 次/天）。
   owner 本人 push 照常部署。
5. README 节奏描述同步。

### 验收

- [x] `snapshot-age --group fast|slow` 本地实测输出正确（fast 163 分钟 → 需刷新）。
- [x] `snap:fast` 真跑成功（抖音 50 条、小红书 20 条，写入正常）。
- [x] `npm test` 212 条全绿；构建通过。
- [ ] push 后观察 Actions：定时运行 ~15 分钟一档、bot push 不再二次部署。
## 2026-10-21 · 第二十轮：选中态进 URL hash —— 刷新/分享都能回到同一个榜

用户："每个分类在路由里面加一个锚点，用于刷新页面之后能定位到这个分类"

### 做了什么

1. **hash 约定**：某个榜 → `#<面板id>`（如 `#weibo` / `#douyin`）；每日视图 →
   `#daily`。用**裸面板 id**而不是 `#panel-<id>`：DOM 里已有 `panel-<id>` 元素，
   带前缀的 hash 会让浏览器加载时跳着对齐它；裸 id 不对应元素，定位全交给
   选中逻辑。旧式 `#panel-<id>` 深链接仍兼容（`boardFromHash` 剥前缀）。
2. **四个部件**：
   - `boardFromHash(raw)`（导出纯函数）：hash → 'weibo'/'*'/'daily→*'，空或
     不认识的返回 null（调用方落默认，不猜）；
   - `initialBoard`：启动时读 `location.hash`（Node 测试环境无 location，
     恒 'weibo' —— 原测试零改动通过）；无效 hash 落默认微博；
   - `syncHash`：`applyFilter` 末尾把选中态写进 URL —— `history.replaceState`
     （不产生历史记录、不触发滚动；#daily 虽有同名元素但 replaceState 不滚）；
   - `hashchange` 监听：手动改 URL / 前进后退时跟着切（自己的 replaceState
     不触发该事件，无循环）；无效 hash 与重复选中都早退。
3. "选中片滚进分类栏可见区"抽成 `revealSelectedChip()`，点选与 hashchange 两处共用。

### 验收

- [x] `npm test` 212 条全绿（新增 boardFromHash 11 条断言；initialBoard 在 Node
      环境恒 'weibo'，原 5 条断言零改动通过）。
- [x] 无头实测七场景：①默认进入 → #weibo 自动落 URL；②点知乎 → #zhihu；
      ③带 #douyin 刷新 → 恢复抖音（本需求主场景）；④取消选中 → #daily；
      ⑤带 #daily 刷新 → 每日视图；⑥旧式 #panel-googleTrends → 正确定位且
      hash 归一为 #googleTrends；⑦无效 hash → 落默认微博。
- [x] 页内 `location.hash='#hupu'`（hashchange）→ 右列只剩虎扑。
- [x] push 后线上实测。
## 2026-10-21 · 第十九轮："数据更新于"全量审计 —— 揪出并修掉三个新榜的运行时错

用户："全局看看，底部都只需要显示数据更新于+日期就行。"

### 全量审计（39 榜逐个无头实测）

首轮审计：34 符合 / 5 不符合。深挖后是**上一轮补 note 时引入的三类真 bug**，
全部修掉，复审 39/39 符合：

1. **eval 现场抓取路径**：底部还是 `{n} 个模型 · 覆盖 {pages} 页 · 抓取于 …`
   （evalDone）→ 换 st.updated；"N 页失败可能不完整"挪到**状态行**（warn 色，
   说的是这次抓取不是常驻口径）。`st.evalDone` 键删除。
2. **aaBench / orApps 漏 note**：上一轮把 st.board 误记在 aaBench 名下
   （其实是 swebench 的子榜说明），aaBench/orApps 的 cfg 里没有 note → 补。
3. **orTrends / orApps 解构错位**（最隐蔽）：这两个榜的 payload 本身是**数组**
   （live fallback 的 Promise.all 产出 [disc, models]），上一轮加 snapTime 时
   写成 `const [disc, models, updated] = await Promise.all([boardData(…), snapTime(…)])`
   —— 外层解构把 disc=整个数组、models=时间戳，运行时"没有解析出任何有效成绩"。
   修法：先接 `[payload, updated]` 再拆 payload。
4. **swebench 闭包**：render(boards, current) 引用了 run 里的 updated（不在
   作用域）→ render 加第三参显式传入。
5. **newmodels**：删 dated 死变量时漏了 `rows: dated` 还在引用 → 内联回过滤。

### 验收

- [x] `npm test` 211 条全绿。
- [x] 39 榜全量无头审计：底部行全部 `数据更新于 …`，零面板报错。
- [x] push 后线上实测。
## 2026-10-21 · 第十八轮：面板底部只留"数据更新于 {time}"

用户反馈（原话）："51 条 · 构建期快照 · 抓取于 10月21日 08:36 · 条目链接指向原平台
底部不要出现太多信息，只需要显示数据更新于+日期就行。"

### 做了什么

1. **底部行统一成一句**：`st.updated` = "数据更新于 {time}"（en: Data updated {time}）。
   旧口径整串退役：条数（`ui.count`/`ui.countFiltered`）、"构建期快照"、
   "条目链接指向原平台"、"来源 …"、"数据日期 … · N 个模型"。
2. **有抓取时刻的榜全都有这行**：此前 trending/spaces/datasets/papers/repos/aider/
   swebench/openrouter 系等十来个榜根本没有 note（只显示条数）。新增 `snapTime(key)`
   助手（与 `boardData` 同缓存键，二次调用只命中缓存）逐榜补齐；拿不到
   `fetchedAt` 就不显示 —— 宁缺勿假，不拿"现在"冒充数据的新鲜度。
3. **两条口径说明挪进面板 hint**（不再挤底部）：
   - eval："上游数据源已归档，站内快照即最新全量" → `p.eval.hint`；
   - wiki："浏览量是 UTC 前一日的" → `p.wikiAttention.hint`。
   状态行（加载/失败/旧快照回退：`st.evalDone`/`st.staleSnap`/`st.orTotal` 等）不动
   —— 那是瞬态反馈，不是常驻底部。
4. i18n 清理：删 12 个死键（zh/en 各 6）。

### 验收

- [x] `npm test` 211 条全绿（trend 105）。
- [x] 无头实测 8 个抽样榜（weibo/douyin/trending/openrouter/papers/eval/wiki/google）：
      底部行全部只有"数据更新于 …"，行数正常（weibo 50、google 10…）。
- [x] push 后线上实测。
## 2026-10-20 · 第十七轮：品牌词只留页头一处（去链接）+ 全断点分类栏复验

用户反馈（原话）："这有两个不知道么趋势大盘 … 移除一个，就显示 趋势大盘 就行，
不用跳转了。然后各种屏幕下的分类选择部分的样式都要考虑一下适配"

### 做了什么

1. **"趋势大盘"只留页头一处，且不再是链接**
   - 页头左上角从 `<a class="nav-home" href>` 改成 `<h1 class="nav-home">`：
     扁平站每页都是首页，指向自己的跳转没意义；它兼作页面唯一的 `<h1>`
     （大纲不变：h1 站点名 → h2 主题段 → h3 面板）。
   - 内容区的 `.home-head`/`.home-title` 整块删除，只留一句 `.home-sub` 描述
     （上轮的渐变文字视觉移到 `nav-home` 上，clip:text 失败回落 ink）。
   - 首屏因此再抬一档：内容区从描述行直接开始。
2. **测试口径同步**：页头断言改为"品牌名 h1（非链接）+ 语言切换 1 个链接 +
   主题按钮"，并加一条反向断言（`<a class="nav-home">` 不许回来）。
3. **全断点分类栏复验**（1600/1440/1280/1100/1024/900/768/560/414/390 十档）：
   ≥1024 左列分栏（栏宽 228–272，组列表 sticky、通高等高）；
   ≤1023 折叠为「当前榜 ▾」按钮 + 展开面板；全部无横向滚动。
   （顺带把十六轮弄丢的日志大标题补回来。）

### 验收

- [x] `npm test` 211 条全绿。
- [x] 无头实测：10 档宽度品牌 h1 唯一非链接、描述行可见、模式切换正确；
      手机 390 展开面板选知乎 → 收起、右列只剩知乎；PC 1440 选"值得买"→
      栏内滚 559px 进可见区、页面 scrollY=0、左右栏等高（953=953）。
- [x] push 后线上实测（页头唯一"趋势大盘"、home-title 零残留）。

## 2026-10-20 · 第十六轮：<title> 换成"品牌词 + 一句描述"（BRAND 占位符退役）

用户："将这个作为title，趋势大盘 / 39 个榜单收进一个页面 —— 模型热度、开源生态、
评测表现、AI 资讯与中文热榜。"

### 做了什么

1. **两页标题直写**（骨架文案约定）：中文 `趋势大盘 39 个榜单收进一个页面 ——
   模型热度、开源生态、评测表现、AI 资讯与中文热榜。`；英文页同构。
   原 `<title>` 是 `{{BRAND}}`，而 BRAND='Trend' —— 一个占位符产不出"按语言
   不同的品牌词 + 整句描述"，机制与需求错配，**退役**。
2. `src/site/brand.js`：删 `BRAND_PLACEHOLDER` / `injectBrand`；`BRAND='Trend'`
   降级为工程日志用短名；`findUnresolvedPlaceholders` 保留（GTM/THEME_BOOT/
   SITE_NAV/… 的门禁还在用它）。
3. `build-site.mjs` 去掉 injectBrand 调用；nav.js/en 页注释同步改口径。
4. `site.test.js` 标题门禁重写：品牌词打头（趋势大盘 / Trend boards）+ 含描述
   短语 + 无残留占位符 + **源页面标题与发布物一致**（标题不再有构建期注入）。

### 踩坑（各留一句）

- 注释里写了字面 `{{BRAND}}` / `<title>`，分别被占位符门禁和标题正则逮住 ——
  门禁都工作正常，是注释措辞的锅，改词（注释里不写会被正则匹配的字面量）。

### 验收

- [x] `npm test` 211 条全绿；构建通过，dist 两页标题逐字正确。
- [x] push 后线上实测（CI 自动部署）。


## 2026-10-20 · 第十五轮：首页头区换描述文案 + 整体上提 + 左右等高

用户反馈（原话）："趋势大盘 的文字描述替换首页，整体设计往上提一下。左右等高，美观一点"。

### 做了什么

1. **头区：标题 + 站点描述**（`index.html` / `en/index.html`）
   - 原来首页只有光秃秃一个 `<h1>`；现在 `.home-head` 里标题旁（宽屏基线对齐、
     一行排开）放一句站点描述："39 个榜单收进一个页面 —— 模型热度、开源生态、
     评测表现、AI 资讯与中文热榜。"（英文页同构）。
   - meta description 同步改写（原句"趋势大盘 是一个趋势大盘"叠词别扭）。
   - 文案是骨架文案，仍按"骨架手写、不进字典"的约定，中英各写各的。
2. **整体上提**：`.home-head` margin-top 20 → 8px，`.home-layout` 18 → 10px；
   标题 22 → 20px。首屏内容整体上移约 20px（实测标题顶 72 → 61px）。
3. **左右等高**（PC ≥1024）
   - `.home-layout` 从 `align-items: start` 改 **stretch**：左栏与右列通栏等高，
     右侧分隔线一路画到内容底部（不再"左边一截、右边老长"）。
   - 吸顶从 `.board-index` 挪到栏内 `.idx-groups`：滚动时组列表钉在页头下方、
     超出视口栏内滚，栏本体（边线）保持贯穿。
   - `trend.js` 的"选中片滚进可见区"跟着换滚动目标：谁真的纵向溢出滚谁
     （`.idx-groups` 实际溢出才滚它，否则落到 `.board-index`——横滑条上的
      scrollTop 调整是无害 no-op）。
4. **美观小件**：分组名旁加**榜单数**（`idx-group-n`，nav.js 推导落值，
   不手写；窄屏 `display:none` / 包装层 `display:contents`，窄屏几何零变化）。

### 验收

- [x] `npm test` 全绿（211 条；site.test 的 `idx-group-label` 断言不受影响 ——
      组名 span 内容保持只有主题名，数字在兄弟元素里）。
- [x] 无头实测 1600 / 1280：头区 flex 一行、railH = mainH（2100 = 2100，等高）、
      组列表 `position: sticky`、计数 6 个可见、无横向滚动；
      768 / 390：头区退两行、计数隐藏、几何与改前一致。
- [x] 交互：默认选中微博（右列可见面板只有 panel-weibo）；点"值得买"→ 栏内
      scrollTop 559 把片滚进可见区、页面 scrollY 保持 0；取消选中 → 每日视图
      出现；滚到页底 → 组列表仍钉在 52px、左右栏底缘齐平（900 = 900）。
- [ ] 推送上线（本轮改动已提交本地，待 push —— CI 会随 push 自动部署）。

---

## 2026-10-20 · 第十四轮：快照停在 08:00 —— cron 被丢，刷新判据改成"数据够旧才刷"

用户反馈（原话）："30 条 · 构建期快照 · 抓取于 10月20日 08:00 · 条目链接指向原平台，
怎么还是8点的，现在都12点了"

### 根因（不是页面显示问题）

GitHub 的 cron **整次丢触发**。Actions 页面按 `event:schedule` 过滤，总数只有 2 条：
`2026-10-19T20:00Z` 与 `2026-10-19T23:48Z` —— 之后 `23 */2 * * *` 的
`00:23 / 02:23 / 04:23Z` 三轮**一次都没跑**。而工作流的刷新步骤条件是
`event_name == 'schedule' || 'workflow_dispatch'`，push 只部署不抓，
于是线上数据一直停在最后那轮 `00:05Z`（北京时间 08:05，页面显示 08:00）。

### 做了什么

1. 新增 `scripts/snapshot-age.mjs`（`npm run snap:age`）：取全部 `data/*.json`
   里**最新**的 `fetchedAt`，超过 90 分钟判 `stale=true`（`stale=false` 时退出码 1）。
   阈值可用 `SNAP_MAX_AGE_MINUTES` 覆盖。口径说明：用"最新"而不是"最早" ——
   微博等源用站方 `create_time`，本来就可能落后几小时，拿它当准会每轮都判该刷。
2. `pages.yml`：刷新/提交两步的条件从"事件类型"改成 `steps.snap.outputs.stale`。
   定时触发仍是主路径；push 成了 **cron 被丢时的兜底**，数据新鲜时什么都不做。
   判龄脚本自己崩掉时（输出没写出来）按"该刷"处理 —— 宁可多刷一次，
   也不要静默跳过（这正是本轮故障的形态）。
3. 手动跑了一轮 `snap:all` 并把全部 43 份快照提交（`5ec1c39`），线上立刻回到 12:32。

### 验收

- [x] `node scripts/snapshot-age.mjs` 在本地 4 分钟新鲜时输出"仍然新鲜"、退出码 1；
      `SNAP_MAX_AGE_MINUTES=1` 时输出"需要刷新"、退出码 0。
- [x] `snap:all` 全绿：`逐榜快照：成功 18 / 失败 0`，中文热榜 13 源 477 条，
      微博 52 条（榜首换成了 04:18Z 的新一条）。
- [x] 手动快照提交后 `git push`，`npm test` 全绿。

## 2026-10-20 · 第十三轮：PC 左右分栏、默认选中微博、移除刷新按钮

用户反馈（原话）："PC端，你就左右分栏把，不要折叠分类固定住不要滚动。
然后默认选微博的分类，如果不选才会出现名人名言。" 随后补："移除刷新按钮，不用刷新"

### 做了什么

1. **左右分栏（≥1024px）**：`index.html` / `en/index.html` 的
   `{{BOARD_INDEX}}` 与正文包进 `.home-layout`，正文再包一层 `.home-main`。
   左列是分类栏（`clamp(228px, 20vw, 272px)`），`position: sticky; top: 52px`，
   **不折叠**（`.idx-current` 宽屏 `display:none`）、**不随页面滚**
   （超高时栏内滚动，`max-height: calc(100vh - 52px - 24px)`）；
   右列正文收在 860px。≤1023px 完整退回原来的上下布局 + 可折叠索引条。
2. **默认选中微博热搜**：`initialBoard()` 从 `'*'` 改为 `'weibo'`。
   每日视图（名言 + 历史上的今天）只在**取消选中**（再点同一片）时出现。
3. **移除刷新按钮**：`renderTopics` 不再产出 `.topic-head-row` / `data-refresh-topic`；
   `trend.js` 删掉 `wireTopicRefresh` / `reloadTopic`；`i18n.js` 删 `hero.refreshing`
   与 `ui.refresh`；`i18n.test.js` 的孤儿键规则把 `hero.*` 一并算进去。
4. **懒加载观察器退役**：右列一次只显示一个榜，"滚到才拉"没有意义了
   （`observePending` / `IntersectionObserver` 删除）。进页面只拉选中的那一个，
   切榜时拉新选中的那个。切榜**不滚动页面**；分类栏自己把选中片滚进可见区
   （手算 `scrollTop`，`scrollIntoView` 会连带滚动页面 52px）。

### 验收

- [x] `npm test` 全绿（trend 99 / site 46 / i18n 9 / …）。
- [x] 无头实测 1600 / 1440 / 800 / 390 四档：1440 下两列 272px + 980px，
      分类栏滚动后 `top` 仍为 52px（不随页面走），无横向溢出；
      1440 下 `.idx-current` 为 `display:none`，800 / 390 下为 `flex`。
- [x] 默认选中「微博热搜」，右列只有 `#panel-weibo`；点知乎 → 只显示知乎、
      页面 `scrollY` 仍为 0；再点知乎 → `#daily` 出现（名言 + 8 张历史卡）。
- [x] 发布物里 `data-refresh-topic` / `topic-refresh` / `id="refresh"` 均为零。

## 2026-10-19 · 第十二轮：索引条吸顶、去掉面板头的主题/来源片、内容保持居中

用户反馈（原话）："pin top board that used to filter kind. and remove …"
（引用了面板头里的「平台洞察 / OpenRouter」两片），随后补了一句
"keep the content place center"。

### 做了什么

1. **索引条重新吸顶**：窄屏（≤900px）从"六行 + 不吸顶（168px）"改成
   "**一行横滑 + 吸顶**（约 42px）"—— 组名夹在中间当分隔（`::before` 竖线），
   右缘渐隐提示可滑。宽屏仍是六行分组（181px），吸在页头下方。
   这一条同时解决了上一轮"手机上吸 170px 挡掉半屏"的问题：
   它还是吸顶的，但只让出一条窄边。
2. **去掉面板头里的主题/来源片**：`panel()` 不再渲染 `.panel-tags`；
   `tagChips()` / `tagsOfBoard` 的展示用途与 `filter.tag` 整个维度删除
   （`boardVisible` 现在只看 `board`）。i18n 里 `tagChips` 与 `escTag` 一并删掉。
3. 内容仍居中：`.wrap` 的 `max-width: 1320px` + `margin: 0 auto` 不变，
   索引条与主题段都在同一列里左对齐。

### 验收

- [x] `npm test` 全绿（trend 98 / site 46）。
- [x] 无头实测四档宽度：1600 / 1280 索引条 181px 吸顶；768 / 390 为 41–42px
      吸顶（上一轮是 168 / 163px 且不吸顶）。
- [x] 面板头不再有 `.panel-tags` / `.tag-chip`；点榜片只看那一个、再点恢复。
- [x] 1600px 下内容列 133–1453 居中，四档均无横向溢出。

## 2026-10-19 · 第十一轮：去掉子视图与展开表、刷新挪到分类标题、选择器重新设计

用户反馈（原话）："直接显示榜单，不要全部仅 AI 相关，这些，也不用展开，默认给出
前面的 50 或者一定数量的就行。另外，刷新应该在下面的内容分类标题旁边。下面的
内容应该居中左对齐，然后上面的分类选择有点丑，需要优化一下"

三个取舍当场问了用户，回答是：**所有子视图切换都去掉**、**每个分类标题各一个刷新**、
选择器用**按主题分组的紧凑标签**。

### 做了什么

1. `trend.js`
   - 删掉全部子视图切换：`subBoardChips` 与 9 处调用（repos 时间段、ghTrending 的
     仅 AI、hotList 的仅 AI、Google 趋势区域、SWE-bench 子榜、OpenRouter 上升/性能/
     评测/应用），以及对应的 9 个 `wireOnce` 委托。每个 loader 现在固定一个默认视图
     （热榜全部、GitHub Trending 仅 AI、仓库本周、Google 美国区、SWE-bench Verified、
     上升榜/延迟榜/综合智能/应用日榜）。
   - 删掉「完整列表」折叠区与表格：`mountBoard` 只渲染列表，默认 **前 50 行**
     （`cfg.cardLimit ?? 50`），列表下方一行 `.list-note` 写"共 N 条 · 快照口径"。
     连带删除 `table()`、`controlsHtml()`、`groupOptions()`、`wireOnce()` 与它们的测试。
   - 整页刷新 → `reloadTopic(topic)`：只重跑该主题段里**已加载**的面板。
2. `src/site/nav.js`
   - 索引条改成**按主题分组**（六行，组名在左、榜在右），删掉「全部」片；
   - `renderTopics` 的标题行加右侧「刷新」（`data-refresh-topic="<slug>"`）。
3. `site.css`
   - 索引条：分组用 `--idx-label-w` 对齐；片无描边、单行省略；
     ≤900px 每类一行横滑且整条不吸顶（实测 768px 从 280px 降到 168px）；
   - 内容列 `max-width: 1240 → 1320`，整体居中、内部左对齐；
   - 删掉折叠区 / 表格 / 控件 / `.chips` 的样式。
4. i18n：删掉 `ui.aiOnly` / `ui.showAll` / `ui.geoNote` / `ui.fullList` /
   `ui.moreInList` / `p.ghTrending.ai|all` / `col.monthStars` / `col.totalStars` /
   `hero.refreshed`，并改掉仍在说"可切全部 / 10 个区域"的 hint。

### 验收

- [x] `npm test` 全绿（trend 98 / site 46 等，条数因删测试而减少）。
- [x] 无头实测 1600 / 1280 / 768 / 390：索引条 181 / 181 / 168 / 163px，
      宽度 1600px 时内容列 133–1453 居中，四档都无横向溢出。
- [x] 交互：点榜片 → 只剩该面板；再点 → 39 个回来；面板头标签片仍能就地收窄
      （15 个中文热榜）；`[data-refresh-topic]` 六个，旧的 `#refresh` 已不存在；
      `details` / `.chips` / `.list-note` 计数符合预期；面板列表 50 行、
      快照榜的说明行仍在。

## 2026-10-19 · 第十轮：索引条去掉「全部」+ 压高度 + 移动端适配

用户反馈（原话）："不要全部这个选项，然后下面的榜单宽度和上面的不要相差这么多，
但是榜单选择也不要太高，你看着办。同时要适配以下移动端。"

三个要求各自落到：

1. **去掉「全部」**：出口改成"再点一次选中的片"（与面板头标签片同一个手势）。
   `renderIndex` 不再产出 `data-jump="*"`；`aria-pressed` 初值全是 false
   （= 39 个都显示），`trend.js` 的 toggle 也删掉 `*` 分支；`site.test.js` 钉住
   "不许再出现 `data-jump=\"*\"`"。
2. **宽度对齐**：原来是 pill，宽度跟着文字长短走（"SWE-bench（真实代码修复）"
   能比"知乎热榜"宽一倍），与下方 390px 的面板列完全不是一档。改成无描边、
   ≥900px 时 4 列等宽网格（1280px 下每格 299px、1024px 下 241px）。
3. **别太高**：网格版整条 212px（39 格 × 4 列 = 10 行，片高 19px、gap 1px）。
   中间宽度（768–899）与手机用横滑一条（64–93px 高）。
4. **移动端**：390px 下横滑一条、片高 44px（触控目标）、右缘渐隐提示可滑、
   整页无横向溢出；实测滑到最后点"小红书热榜"能正常只看它。

### 踩到的坑

- **网格在中间宽度会反弹**：768–1024px 用 `auto-fill`/固定列数时，39 格只能排
  3–4 列 → 10–13 行、吸顶条 377–475px（实测），比横滑条高 5 倍。所以网格只在
  ≥900px 存在，其余走 flex 横滑 —— 两种形态，一条断点。
- **只靠截断不解决"太高"**：名字两行 clamp 让长名折行，条子直接顶到 282px；
  改成单行省略（`title` 里保留全名）+ 无描边 + 无 padding 才是 212px。
- 无头实测发现窄屏最后一片被切在屏幕边缘，读者会以为索引到头了 —— 加右缘渐隐。

### 验收

- [x] `npm test` 全绿（site 45 / trend 105 等）。
- [x] 无头实测四档宽度：1280（4 列网格 / 212px）、1024（4 列 / 212px）、
      768（横滑 / 64px）、390（横滑 / 93px，无横向溢出）。
- [x] 交互：点微博 → 只剩 `#panel-weibo` 且它 `aria-pressed=true`；再点 → 39 个回来；
      手机横滑到末尾点小红书 → 只剩 `#panel-xiaohongshu`。

## 2026-10-19 · 第九轮：索引条改成 39 个面板平铺

用户要求（原话）："37个来源直接打平放在最上面选择就行吧" —— 数字对不上
（站里没有 37：榜单上一轮已从 37 加到 39，来源 slug 是 26 个），所以先问清了
对象与两个交互取舍：

| 问题 | 用户选择 |
|---|---|
| "37 个来源"指哪一批 | **39 个榜单面板**（索引条第二行那串） |
| 索引条原来几行怎么处理 | **只留这一行平铺 + 刷新**（主题行、来源行撤掉） |
| 点一个做什么 | **只看那一个**（再点一次取消；「全部」常驻） |
| 这一行怎么摆 | **自动换行，全部可见** |

### 做了什么

1. `src/site/nav.js`：`renderIndex` 重写。一行 = 「全部」+ 39 个
   `<button class="idx-chip" data-jump="<id>">`（带面板图标；来源色由
   `site.css` 的 `[data-jump="<id>"]` 染）。删掉主题筛选行与来源筛选行；
   `NAV_TEXT` 的 `allTopics` / `sources` 换成 `allBoards`。
2. `trend.js`：筛选总线从 `{topic, tag}` 改成 `{board, tag}` ——
   **索引条点一个榜 = 只看那一个**（`data-jump`），面板头的标签片仍是就地筛选
   （`data-tag-filter`）。两者**互斥**（选了标签就回到多榜视角，选了榜就只看它）。
   点榜后滚动用**实测索引条高度**让开吸顶（39 片自动换行，高度随屏宽变），
   不再用 `scrollIntoView`。
3. `site.css`：删 `.idx-jumps` / `.idx-sources` / `.idx-lbl` / `.idx-jump` /
   `.idx-n`；`.idx-boards` 换行；来源色选择器改指 `.idx-chip[data-jump]`。

### 无头实测出的一个真问题

39 片在 390px 宽下折成 **18 行、整条吸顶条 531px** —— 占掉大半屏，吸顶反而挡路。
所以窄屏（≤720px）给平铺行 `max-height: 30vh` + 条内滚动（实测降到 305px）。
这算是把"全部可见"在窄屏上改成"全部可达"；桌面端（1280px 宽）仍是全部可见，
实测 199px 高。

### 验收（本地）

- [x] `npm test` 全绿（i18n 9 / ui 7 / theme 12 / trend 105 / ainews 16 / newboards 22 / site 45）。
- [x] `npm run build` 通过；`dist/index.html` 里恰好 40 个 `data-jump`（39 + 全部）、
      0 个 `data-topic-filter`。
- [x] CDP 实测：点「微博」→ 只有 `#panel-weibo` 可见、它自己 `aria-pressed=true`、
      「全部」变 false；再点一次微博 → 39 个都回来；面板头点 `cn-hot` → 15 个可见；
      390px 下无横向溢出。

## 2026-10-12 · 第八轮：卡片栅格 → 扁平行列表（照 momoyu.cc 的列表样式）

用户要求（原话）："设计扁平一点，参考一下 momoyu 的，列表样式啊。"
对象是**面板里那一块**（每个面板顶部原先是三列描边圆角卡片栅格，前 10 名）。
四个决定当场问了用户：

| 问题 | 用户选择 |
|---|---|
| 点一行做什么 | **直接去来源**（`<a target="_blank">`），不再弹详情 |
| 显示多少行 | **20 行**（原 10） |
| 5 个拿不到行级链接的榜 | **行不可点**（纯展示，不假装可点） |
| 详情浮层 `<dialog>` | **一并删掉**（改完即无调用方） |
| 面板头两片筛选标签 | 保留，**收小去描边** |
| 行下的小标签行 | **保留**（与 momoyu 唯一有意的形态差异） |

### 做了什么

1. `trend.js`：`cardGrid()` → **`cardList()`**，产出 `<ul class="card-list">` + 每行
   `<li><a class="li">`（有地址）或 `<li><span class="li">`（无地址）。`cfg` 契约
   `{title,value,meta,link}` **一字未改**，19 处调用点原样不动。
   - ★ **逐行判 link**，不是按榜判一次：`orApps` 给的是 `link: (r) => r.url`，个别行
     url 为空 —— 按榜判会产出 `<a href="">`，一点跳回本页。
   - ★ **`esc(href)`**：地址现在进的是**属性位**（以前只经 `openDetail` 的文案），
     上游原始 URL 带 `"` 就能闭合属性插标签。
   - 删 `openDetail` / `detailRow` / `detailFromCols` 与 `[data-card]` 点击绑定；
     `site.css` 的 `.detail*` 一段同步删。
2. `mountBoard`：列表 10 → **20 行**；顺手理清三个互相矛盾的计数（见下"踩到的坑"）。
3. `site.css`：**面板去描边**（`--surface` 与 `--bg` 差一档即分得开）、圆角改
   `--radius-panel: 20px`（与 `--radius` 10px 分家）、`.panel-head` 去分隔线；
   卡片段换成无框列表段；**每个面板头那两片筛选标签也去掉描边**（否则版面只剩这几个框）。
   新增 `--rank-1/2/3` **文字色** token（前三名数字染色，照 momoyu）。
4. `i18n.js`：删 `ui.close` / `ui.openSource` / `ui.top10`（最后一个是早就没调用方的死键）；
   `ui.moreInList` 改为"下面完整列表里还有 {n} 条"。

### 踩到的坑（值得记）

- **三个计数互相矛盾**：`swebench` 取数收了 89 条、`cfg.limit: 40` 只展示前 40，
  而折叠区标题原写 `rows.length` ⇒ 显示"完整列表（89 条）"、展开只有 40 行；
  说明行写 89 条；列表下方又说"还有 48 条"。改成**三个数各自取对**：
  总条数 / **表格真正显示的条数**（= `shown.length`，已切过 `cfg.limit`）/ 列表条数。
  现在 swebench 读作：说明行 89 条、折叠区（40 条）、下面还有 20 条。
- `--gold` 在亮色下压白底只有 **3.2:1**，当**文字**（名次数字）读不清 —— 所以
  `--rank-*` 另取更深的一档（亮色 `#b45309` / `#64748b` / `#92400e`，≥4.5:1）。
  同一个色值当背景填充行、当文字不行，这正是本站"两套主题各自取值"的理由。

### 验收（本地）

- [x] `npm test` 全绿（i18n 9 / ui 7 / trend **105** / ainews 16 / site 40）。
  新增 4 条列表断言：逐行 link 判空、`href` 属性转义、行内不套 `<a>`、
  以及一条**源码级门禁**（钉住 `openDetail`/`detailFromCols`/`data-card` 不再出现）。
  两条基于 `card-meta`/`card-value` 的旧断言按新类名（`li-meta`/`li-val`）保留 ——
  它们是 `cfg.meta` 缺省那次真实故障的回归测试，不能丢。
- [x] `npm run build` 通过；`grep` 确认 `web/ src/ scripts/` 下无残留引用。
- [x] 无头实测（CDP）：暗/亮两套主题、`#panel-zhihu`（有链接）与 `#panel-swebench`
      （无链接）各截图。断言：面板与行的 `border` 均为 0、行背景透明、`r1` 染色
      （暗 `#f0b429` / 亮 `#b45309`）、行高 29px（桌面）/ 48px（390px 宽）、
      `#panel-zhihu` 20 行全是 `<a target=_blank rel=noopener noreferrer>`、
      `#panel-swebench` 20 行 `<a>` 计 0、`a a` 计 0、`dialog#detail` 计 0、
      390px 下横向溢出 0、9 个面板的计数行三者对得上。
- [x] `eval` 首次拉取撞上游限流（"第一页就没取到"）后重试成功 → 20 行正常（取数路径未动）。

### 已知、与本轮无关的一处数据缺陷

`assets/data/ai-news.json` 里有 14 处 HTML 实体以**字面量**存着
（`&#8217;` / `&#039;`，来自上游 RSS），页面渲染出字面量 "&#8217;" 而不是 `'`。
在 `5e84c3d` 就已存在（抓取脚本的实体还原表不全），本轮只改了展示层，**未动**它 ——
单独一轮修 `scripts/fetch-ai-news.mjs` 的实体还原更容易看清。
（另有一处同名旧账：GitHub Trending 的 `&#39;`，见第七轮 git 记录。）

### 未做（留给下一轮）

- [ ] 推送上线 + 线上实测 + 微信交付。
- [ ] 上面那处 RSS 实体字面量的抓取脚本修复。

## 2026-10-12 · 第七轮：改成单页站（首页装下全部 34 个面板，没有二级页面）

用户要求（原话）："页面扁平设计，不用点击二级页面。" 三个范围问题当场确认：

| 问题 | 用户选择 |
|---|---|
| 扁平到哪一步 | **首页装下全部，首页带标签过滤，标签小一点**（删 34 个榜单页 + 两个标签页） |
| 取数时机 | **滚动到才加载** |
| 怎么找榜/逛 | **粘性索引条 + 主题六类分组** |

第六轮"保留一张卡一个面板入口"的结构这一轮被推翻；第六轮的**视觉**（暗色默认、
momoyu 取色、13 个来源色）保留不动。

### 做了什么

1. **`trend.js` 扁平化**（主体）：
   - 主题分段：新增 `rootFor(id)` —— 面板挂进 `#topic-<主题> [data-panels]`，
     `attachPanel` 的"同 id 原地替换"因此是在**段内**生效（切子榜不跳段）。
   - 骨架复用：新增 `ensurePanel(meta)`（幂等）+ `shellMeta(id)`。启动时先同步建
     34 个骨架（零网络），loader 复用同一元素 —— 于是 34 处 `panel({…})` 改成
     `ensurePanel(...)`（字面替换）。
   - 懒加载：`observePending`（IntersectionObserver，`rootMargin: 600px`），
     命中即 observe→startLoader；不支持 IO 时退化成全部加载。
   - 标题层级：`SINGLE_BOARD ? 'h1' : 'h3'`（页面 h1 = 站点名、主题段 h2）。
   - 筛选总线：`boardVisible(id, filter)`（纯函数，已导出）+ `applyFilter` +
     `wireFilters`（绑 **document**，见下"踩到的坑"）。
   - 大表格延后：`mountBoard` 的完整表放进 `.table-slot[data-deferred]`，
     `details` 首次展开才建（`eval` 是 4576 行 × 9 列）；搜索加 120ms 防抖。
   - 深链接 `#panel-<id>`：`startAll` 读到就立刻 `startLoader`，不等滚动。
2. **`boards.js`**：新增 `BOARD_ICONS`（头像真值，从 `src/site/nav.js` 搬来 ——
   浏览器要它建骨架）与 `BOARD_ORDER`（按主题分段的排列，推导而非手写）。
3. **`src/site/nav.js`**：删 `renderTagsPage`/`renderTagPage`/`tagCard`/
   `tagKindSection`（标签页没了）；`renderNav` 去掉「标签」项（页头两样）；
   新增 `renderIndex`（吸顶索引条）+ `renderTopics`（六个主题段骨架）。
   删掉 34×2 的 `BOARD_TITLES` 手抄表 —— 面板名改从 `i18n.js` 的 `p.<id>.title` 取，
   整个仓库只剩一份。`BOARD_ICONS` 也改为引 `boards.js`。
4. **`i18n.js`**：`tagChips()` 由 `<a href="tag.html?t=…">` 改成
   `<button data-tag-filter="…">`（就地筛选，不跳页；也天然躲开 `<a>` 套 `<a>`）。
5. **构建/删除**：`SITE_FILES` 从 ~86 项缩到 11 项；删 34×2 个榜单页、四个标签页、
   `assets/tags.js`、两个孤儿 `momoyu.html`。
6. **`site.css`**：面板容器改 `#panels > .topic > .topic-grid`；新增索引条
   （吸顶 `top: 52px`）与主题段样式；删 `.entry-grid`/`.board-links`/整套标签页样式；
   `.panel-head :is(h1, h2, h3)`；13 个来源色选择器改指 `.idx-jump[data-jump]`。
7. **测试**：`site.test.js` 从"逐页扫描"改成"单页门禁"（发布集合恰两页、
   六个主题段都在、索引条 6+34 片、恰一个 h1、头像都有图标、旧页面删净）；
   `trend.test.js` 新增 BOARD_ORDER 完备性/分段连续/头像可渲染/懒加载源码级/
   `boardVisible` 真值表/`wireOnce` 只绑一次。`trend.test.js:855` 那条源码门禁
   同步成 `attachPanel(rootFor(id), el, id)`。

### 踩到的坑（两个，都是"页面上看不出来"的那类）

1. **索引条是 `#panels` 的兄弟**，不是子节点。筛选委托一开始绑在 `panelsRoot` 上，
   于是点索引条的主题/来源片**毫无反应**（面板头里的标签片倒是能）。
   由一段临时 DOM 探针（点一下再把 `visible/hidden` 写进 `title`）照出来的 ——
   改成绑 `document`。
2. **`{{SITE_NAV}}` 也出现在 `site.css` 的注释里**，而构建对**每个**发布文件都跑
   `injectNav` —— 于是那段导航 HTML 被塞进 CSS 的一条注释里（产物看着像损坏的 CSS）。
   这个隐患在第六轮就存在（那时 CSS 里也写着这个 token），只是没看产物。
   本轮把占位符替换**收口到 HTML**，并把注释里的字面量改掉。另：`index.html` 注释里
   写出的 `{{BOARD_INDEX}}` 同样被撑开（索引条出现两次）—— 一并改掉。

### 验证

`npm test` 全绿（i18n 9 / ui 7 / trend 103 / ainews 16 / site 40 = 175 条），
`npm run build` 通过（dist 11 个文件）。无头实测（本机 3.5G，一次一条 chrome）：

- **懒加载**（1200×900 视口）：34 个骨架都在，只有 `models` 段前 4 个拉了数据
  （10 张卡/个），其余 30 个仍是 `加载中…` 骨架 —— 证实"没滚到就不拉"。
  （★ 第八轮起同一处显示 **20 行**，且不再有 "卡" 这种形态 —— 本行是当轮的记录，不改写。）
- **深链接** `#panel-zhihu`：zhihu/csdn 立刻有数据（各 10 卡），仍未全量加载。
- **大表延后**：`#panel-swebench` 渲染出 10 张卡但 `<tr>` 为 0（表在收起的折叠区里）。
- **筛选**（DOM 探针）：点「中文热榜」→ 可见 13、隐藏 5 个主题段、`aria-pressed=true`；
  点「全部」→ 回到 34；点来源 `huggingface` → 可见 7，再点一次 → 34；
  先筛选再点跳转 → 清筛选并跳 `#panel-swebench`。
- **暗/亮 + 移动端**（390px）：截图确认索引条四行、主题分段、卡片栅格都正常，
  页面无横向溢出（只有刻意横向滚动的那两条索引行超宽）。
- **旧地址 404**：本地服务下 `trending.html` 返回 404（站点已无二级页）。

### 待办

- [ ] **推送 + 线上实测**：本轮尚未推送。推送后需复核 `index.html` / `en/index.html`
      200 且有数据、旧地址（`trending.html`）404。
- [ ] 快照每日刷新工作流仍未推送（第五/六轮就欠着，需带 workflow 权限的凭据）。
- [ ] 想更激进的话：把 `models`（含 4.8MB 的 newmodels）与 `benchmarks`（含 4MB 的
      swebench）排到主题顺序后面，让首屏更轻 —— 本轮没做，`rootMargin 600px`
      已经让"一屏内"只加载 `models` 段的 4 个。

## 2026-10-12 · 第六轮：照 momoyu.cc 那一版换观感 + 中文热榜不再截断

用户要求（原话）："https://momoyu.cc/ 参考以下这个风格，重新更新以下设计。
另外，你需要包含全部这里的数据"。三处范围由用户当场确认：

| 问题 | 用户选择 |
|---|---|
| 首页要不要变成实时数据大盘 | **只换视觉风格** —— 保留"一张卡一个面板入口"的结构 |
| 范围 | **整站统一换肤**（34 个面板页 + 首页 + 两个标签页，中英各一） |
| 暗色主题 | **暗色为默认，亮色跟随系统** |

### 实测取证（不是凭印象抄的）

`momoyu.cc` 是 Vue SPA（`/assets/index-*.js`），WebFetch 拿不到东西 ——
用无头 chrome 截图 + PIL 采样取的真实配色：

- 页面底 `#18191e`（rgb 24,25,30）、卡片 `#1f2025`（rgb 31,32,37）、
  搜索框 `#2a2d34`。**卡片与页面只差一档亮度，没有描边** —— 密集排布下
  每张卡一圈边线会把版面切碎，这是那一版"密而不乱"的关键。
- 强调色 `#409eff`（CSS 变量 `--el-color-primary`，Element Plus 默认）。
- 每张卡 = 彩色来源字徽（知乎蓝"知"、微博红"微"…）+ 平台名 + "（N分钟前）"，
  下面编号列表：名次带色（前三红）、标题两行、热度右对齐。

API 直测（`/api/hot/list?type=0`）：13 个来源，站方给的 `icon_color` 就是各家品牌色，
本轮直接采用（见下）。站方的榜条数 12–100 不等，**不是 20**。

### 做了什么

1. **配色**（`web/public/site.css` 顶部 token 块重写）：暗色写进 `:root` 当默认，
   亮色由 `prefers-color-scheme: light` 覆盖（仍是"只跟随系统、无切换按钮"的约定，
   所以不需要在 head 插抢绘制前跑的内联脚本）。两套配色各自完整定义 ——
   亮色那套的 `--accent` 特意比暗色深（`#1667c8` vs `#409eff`），
   因为 `#409eff` 压白底只有 ~2.6:1，拿它当链接文字读不清。
2. **新增 `--hover`**：原来 hover 用的是 `--bg`，在亮色世界成立（页面比卡片深），
   换暗色之后 `--bg` 比卡片**暗**，卡片会"陷下去"像按下去了。所以单独一个变量。
3. **密度收紧**：圆角 14→10px、页头 58→52px、面板间距 22→14px、
   表格行距与各处 padding 小一号；入口卡改成 momoyu 那种紧凑卡
   （图标 38→32px、说明收成一行、去掉位移与阴影、hover 换描边+提亮）。
4. **★ 修了一处既有缺陷**：榜单页的标题一直是 `<h1>`（`trend.js` 里
   `SINGLE_BOARD ? 'h1' : 'h2'`），而 CSS 只写了 `.panel-head h2` ——
   于是每个榜单页的标题都退回浏览器默认的 `2em` + 上下 margin，
   比它下面所有内容都大一截。改成 `.panel-head :is(h1, h2)`。
5. **13 个中文热榜的来源色**：把颜色写进 `--src` 变量，两处图标各取一次 ——
   榜单页面板头（`#panel-<id>`）与**首页入口卡**（`a.entry[href="<id>.html"]`）。
   写两份规则迟早漏一处，所以只声明一次。爱范儿站方给的是 `#fff`（白图标在
   浅色主题里等于没有），改用可读的灰 `#6c7a89`。
6. **数据不再截断**（`scripts/fetch-momoyu-hot.mjs`）：`PER_SOURCE_LIMIT`
   20 → `Infinity`。快照 260 → **471 条**（85KB），B站 100、虎扑 60、微博 51
   全都进来了 —— 页面上的"完整列表（100 条）"从此真的是 100 条。
   理由与取舍写在该常量上方与 `docs/trend-sources.md` §9。

### 验证

`npm test` 全绿（9 / 7 / 97 / 16 / 41 = 170 条），`npm run build` 通过。
无头实测（暗色用 `--force-dark-mode`；★ 本机 chrome 默认报
`prefers-color-scheme: light`，不加这个 flag 量到的是亮色）：
首页 · zhihu · repos（真实 GitHub 数据） · bilibili（100 条） · tags · tag?t=cn-hot ·
en/index · 390px 移动端，均正常；亮色版抽样复核未回归。

### 没做（用户明确没选）

首页**没有**变成 momoyu 那种"一屏铺满全部来源的实时大盘" —— 那会推翻
第五轮"一个面板一页"的返修结论。若将来要做，是独立一轮的事。

## 2026-10-01 · 本轮：评测榜限流收尾 + 新增 2 个面板（共 19 个）

### 已完成（本地，未推送 → 已推送见下）

1. **评测榜限流修复**（根因已实测校准，见 `trend-sources.md` §2）：
   - 限流是"突发容量 + 慢回填"令牌桶：桶满时 46 页 8 并发全 200（11.9s）；
     桶半空时连 3 并发都会在尾部撞 429；耗尽后 **~70s 才回填**。
   - `EVAL_FETCH`：3 并发 + 批间 700ms + 普通失败短退避（800ms 起）+
     **429 长退避（25s×次数，封顶 60s）** + Retry-After 优先。
   - 缓存三层：sessionStorage 10 分钟（零缺页才进）→ localStorage 快照
     （7 天直用窗口：数据源 2025-03 已归档，快照即全量）→ 失败回退快照
     （不限龄、如实标"抓取于 {time}"）。"刷新数据"置 force 标记强制重拉。
   - `live-check.mjs` 与页面共用 `EVAL_FETCH`。
2. **新增面板 orCatalog（OpenRouter 模型库）**：浏览器直连
   `openrouter.ai/api/v1/models`（CORS `*`，0.76MB，464 模型），
   价格换算 $/M tokens、按上线时间降序；失败回退 localStorage 快照。
   （侦察清单建议构建期快照，本站改直连：目录近实时，快照会过期，理由见 §7。）
3. **新增面板 ghTrending（GitHub Trending，AI 过滤）**：github.com/trending
   无 CORS → **构建期快照**。`scripts/fetch-gh-trending.mjs` + 每日 cron
   `.github/workflows/gh-trending-snapshot.yml`（00:30 UTC+8），失败不提交、
   旧快照保留。解析器 `parseGhTrending` 与 AI 过滤 `isAiRepo`（词边界）住在
   trend.js，页面与 CI 同一份；快照含 `fetchedAt`，页面标"构建期快照 · 抓取于 …"。
   首版快照已生成并入库（17 条，fetchedAt 2026-10-01T01:02:30Z）。
4. **首页/导航/标签**：手写 index.html 补 2 卡（中英）；nav.js BOARD_TITLES/
   BOARD_ICONS、boards.js BOARD_IDS/BOARD_TAGS 已登记（19 面板）。
5. **测试**：trend.test.js 新增 15 条（退避/429 分级/快照策略钉子/parseGhTrending
   真实 fixture/isAiRepo 词边界/flattenGhTrending/flattenOrCatalog 真实条目）。
   本地 `npm test` 全绿（i18n 9 / ui 7 / trend 92 / site 36），`npm run build` 通过。

### 侦察清单与实际情况的对账（重要）

用户确认的 5 个候选（`~/.hermes/workspace/ai-trend-scout/候选-2026-09-30.md`）：

| 候选 | 实际处理 |
|---|---|
| ① OpenRouter 模型库 | ✅ 本轮新增（orCatalog，浏览器直连） |
| ② HF 趋势模型 | 已存在（`trending` 面板，同端点同口径，浏览器直连） |
| ③ HF 趋势 Spaces | 已存在（`spaces` 面板） |
| ④ HF 趋势数据集 | 已存在（`datasets` 面板） |
| ⑤ GitHub Trending | ✅ 本轮新增（ghTrending，构建期快照） |

②③④无需重复接入；清单建议的"边缘函数"与站点"纯静态无服务端"前提冲突，
且这三个端点 CORS 实测可直连（本来就在线上跑）。

### 完成情况（2026-10-01 09:55）

1. [x] 本地无头实测：ghTrending（14 条 AI、快照声明）、orCatalog（464 模型）、
       eval 快照直用路径（预置 localStorage 验证"快照 · 抓取于 …"免网络直出）。
       eval 取数层另用 Node 真实计时器按最终策略复测：46×200 零重试 25s；
       第二轮撞 4×429 全被长退避救回（4576/4576 零缺页）。
2. [x] 推送上线：b1955fe（主体）→ Actions 部署 → 线上实测全部通过：
       ghTrending / orCatalog / trending / spaces / datasets 五页 200 且有数据，
       eval.html 与 en/ 两页 200，线上 trend.js 已含新代码。
3. [x] 微信交付已发。
4. [ ] 首个 cron（次日 00:30 UTC+8）后确认快照自动刷新成功。
5. [ ] **待推**：651f8c5（每日 cron 工作流）—— 需要带 workflow 权限的凭据
       （本轮 PAT 无该 scope，被 GitHub 拒收）。用户给权限后 `git push` 即可。

### 队列第二轮（2026-10-01 12:10 完成）

- [x] 侦察 + 微信方案 + 用户确认（两个面板都加，新闻全部快照模式）。
- [x] **aiNews 面板**（AI 新闻热点，8 源每日快照）：scripts/fetch-ai-news.mjs
      （逐源回退、失败保旧块）+ parseRss/parseAtom/normalizeHn/DevTo/Lobsters
      （真实 fixture 测试 ainews.test.js 13 条）。当天实测修正三处：
      HN 查询改时间序+10 分（7 天+50 分会整周空窗）、The Verge 是 Atom 且
      链接在 link href、XML 实体未还原（&amp; 会显示成字面量）。
- [x] **momoyu 面板**（摸摸鱼热榜，13 榜聚合快照）：fetch-momoyu-hot.mjs，
      块内 fetchedAt 用站方 create_time；AI 过滤在页面端（isAiText 中英词表），
      "全部/仅 AI"切换。
- [x] 本地全绿（i18n 9 / ui 7 / trend 95 / ainews 13 / site 36）+ 构建通过 +
      无头实测两页有数据（aiNews 149 条 8 组、momoyu 246 条 13 组）。
- [x] 推送上线（5e84c3d）+ 线上实测通过：aiNews（149 条 · 8 组）、
      momoyu（246 条 · 13 组）、en/aiNews 全部 200 且有数据，
      快照 JSON 线上可取（39KB / 45KB）。
- [ ] **待推**：e47b679（refresh-snapshots.yml 三合一每日 cron，替代原
      gh-trending 单独工作流）—— 仍需带 workflow 权限的凭据。推送前
      快照不会每日自动刷新（面板照常工作，只是数据停在入库时刻）。

### 每日快照工作流（待推送后生效）

`.github/workflows/refresh-snapshots.yml`：每天 00:30（UTC+8）跑
fetch-gh-trending / fetch-ai-news / fetch-momoyu-hot，三步各自
continue-on-error（部分成功仍提交成功部分），diff 为空不提交。

### 环境注意（AGENTS.md 纪律）

- 本机 3.5G 内存：无头 chrome 一次一条；起渲染前 `free -h`。
- datasets-server 校准数据当天已打过几百个请求，桶回填需 ~70s，勿连测。
- 微信通知：`/home/shaowenchen/Projects/.dsh-hooks/notify.sh "…"`（失败不重试）。

## 2026-10-01 · 第三轮：AI 官方要闻（用户点名 8 家一手信源）

- [x] 逐源实测：7 家 RSS 全通（OpenAI/TechCrunch·AI/Ars·AI/GitHub Blog/
      DeepMind/MSR/NVIDIA）；**The Decoder 域名挂牌出售**（GoDaddy 停靠页）
      → 观察项，快照 skipped 字段如实记录并在页面显示（trend-sources.md §10）。
- [x] fetch-ai-press.mjs（复用 §9 的 parseRssItems，逐源回退 + 直跑守卫）；
      aiPress 面板与 aiNews 共用 mountNewsPanel 工厂（一手源无热度口径 →
      不硬造列，卡片主数值是时间；观察项进 note）。
- [x] 快照入库 7 源 117 条；本地全绿（trend 95 / ainews 16 / site 36 等）+
      无头实测（117 条 · 7 组 · 观察项声明可见）。
- [x] 推送上线（8ec9e34）+ 线上实测通过：aiPress / en / 快照 JSON 全 200，
      面板 ok、117 条、**7/7 源有条目**（DoD ≥6），note 显示
      "最老来源抓取于 … · 观察项：The Decoder"；微信交付已发。
- [ ] **待推**：16417cc（四合一每日快照工作流 refresh-snapshots.yml）——
      仍需带 workflow 权限的凭据。注意：工作流提交不能混进面板提交的
      祖先链（GitHub 按"推送包含的提交树"判 workflow 权限，推过一次
      被拒：即便面板提交本身不含 .github，祖先链里的工作流提交也会挡）。

## 2026-10-01 · 第四轮：momoyu 细化为「科技热榜 + 中文热榜」两个精选面板

- [x] API 复测（200 · 13 榜 · 条数与用户给的一致；无 CORS → 快照维持）。
- [x] 用户方向 + 自主取舍（方案/理由在 trend-sources.md §9 与 trend.js 注释）：
      科技热榜 8 榜（知乎/CSDN/掘金 + IT之家/虎嗅/爱范儿/中关村在线 + B站）、
      中文热榜 4 榜（微博/头条/虎扑 + 豆瓣）、值得买落选（促销比价）。
      两个面板共用同一份全量快照（fetch 脚本不变），分组真值
      MOMOYU_TECH_KEYS / MOMOYU_CN_KEYS 在 trend.js。
- [x] 替换原 13 榜全量面板（momoyu.html 已删，页面 404）；本地全绿
      （trend 97 / ainews 16 / site 36）+ 无头实测（techHot 148 条 8 组、
      cnHot 80 条 4 组，note 标"momoyu.cc 聚合"）。
- [ ] 推送上线 + 线上实测 + 微信交付。

## 2026-10-01 · 第五轮：返修——13 个中文热榜独立成页 + 去聚合站品牌

- [x] ①首页入口：线上首页本就有全部面板卡片（23 张，拆分前的版本）；
      本轮拆 13 页后首页共 34 张卡，中英同步。
- [x] ②去品牌：发布物（页面/i18n/标签/JS 注释/快照 JSON/数据文件名
      cn-hot.json）零"momoyu/摸摸鱼"字样；函数名 flattenMomoyu→flattenHotList；
      工程记录（docs §9 + 抓取脚本注释）保留真实管道出处（不编数据）。
- [x] ②拆分：techHot/cnHot 两块聚合面板删除（页面 404），13 个榜各自独立
      面板/路由（zhihu.html…zhidemai.html），共用 loadHotList(key) 加载器
      与同一份全量快照；每页快照声明用该榜的站方抓取时刻。
- [x] "仅 AI"过滤保留（理由一行：全站一致、零成本；命中少是真实信号）。
- [x] 本地：全绿（trend 97 / ainews 16 / site 36）+ 无头实测 13/13 页 ok
      有数据 + 旧页 404 + dist 品牌清扫 0 残留。
- [x] 推送上线（37cd536）+ 线上实测通过：13/13 页中英双语 200 且有数据
      （抽查 zhihu/weibo/bilibili/csdn 面板 ok），首页 34 张入口卡（中英），
      页面零品牌残留；微信交付已发。
- [x] 工作流 refresh-snapshots.yml 已重建为本地待推提交 d9ceb83（四合一，
      步骤名已中性化）—— 推送仍需带 workflow 权限的凭据。

## 2026-10-16 · 第六轮：主题切换按钮（三态）+ 三张新数据榜（34 → 37）

用户："你继续迭代，加入更多趋势数据，给页面加一个主题切换的按钮"。

### ① 主题切换按钮（把 2026-09-23 删掉的那个加回来）

- 三态 **跟随系统 → 亮 → 暗 → 跟随系统**，页头一个按钮，摆在语言切换左边。
- 删掉的原因（"只跟随系统就不用 head 里的内联脚本，也就没有先白后黑的闪烁"）
  本身没错，但它把**配色跟随系统**（好）与**读者不能自己选**（代价）绑在了一起 ——
  暗色成了默认之后，系统偏亮的读者进来看到一整页深色而无法可改。现在把选择权
  还给读者，同时**保住不闪**：内联脚本仍在 head、仍在样式表**之前**、仍非 module。
- ★ **"手动暗"没有新增任何 CSS 规则**：`:root` 本来就是暗色，"手动暗"要做的只是
  阻止 `prefers-color-scheme` 那条媒体查询接管，而 `:root:not([data-theme])`
  已经做到了。少写一条 `:root[data-theme='dark']` 就少一份会漂移的第二真值。
- 新增 `assets/theme.js`（状态/循环/按钮接线 + `bootSnippet()`）、
  `src/site/theme-boot.js`（构建期落内联脚本的占位符注入）、
  `assets/theme.test.js`（12 条）；`site.test.js` 加 5 条**对着发布物**的断言
  （引导脚本在样式表之前 / 不是 module / 页头有那个 button / 模块被发布 /
  按钮文案本地化）—— 这几处错了页面上只是"闪一下"，本地构建与测试全看不出。
- 无头实测 18/18（中英各 9）：跟随系统两态、三态循环、选择被记住、
  加载早期 `data-theme` 已就位；截图确认页头与窄屏观感。

### ② 三张新榜（先实测再决定，用户多选确认）

| 新面板 | id | 源 | CORS 实测 | 上线方式 |
|---|---|---|---|---|
| Hacker News 首页 | `hnTop` | `hn.algolia.com …tags=front_page` | ✅ 通 | **快照**（不是为绕 CORS —— 一次构建期请求对 Algolia 最友好、标注一致；改直连只需删快照） |
| 维基百科 AI 词条关注度 | `wikiAttention` | `wikimedia …/pageviews` | `*` 但**要 UA** | **快照**（`User-Agent` 是浏览器的 forbidden header，无 UA 实测 403 → 浏览器这条路是死的） |
| Google 搜索趋势 | `googleTrends` | `trends.google.com/trending/rss` | ❌ 无 | **快照** |

三张都是**站内此前没有的维度**：`hnTop` 是"技术社区此刻在顶什么"（与 aiNews 里
那个按 AI 关键词搜的 HN 源不同口径）、`wikiAttention` 是**全站唯一的大众注意力**
口径（不是技术圈热度）、`googleTrends` 是**搜索引擎注意力**。

- 三张各配抓取脚本（`snap:hn` / `snap:wiki` / `snap:trends`，另加 `snap:all`）：
  逐源/逐区域回退，全失败才非零退出不写文件；部分成功如实记 `skipped` 并显示在页面。
- ★ 三处实测坑都处理了并各有测试钉住：HN 自帖 `url` 为 null → 回落讨论页
  （否则是"看着能点、点了跳回本页"的空链接）；维基的 AI 判据撞到三类误报
  （法国歌手 Claude Nougaro、五月风暴 Mai 68、俄文形容词 Искусственный +
  "AI 词根在逗号之后的限定从句里"）→ 词根只匹配第一个逗号之前 + 精确排除表 +
  每语种白名单；Google 热度是 `2000+` 这种**粗粒度字符串** → 保留原文不解析成数字。
- 维基是 **8 语种**（只取英文会把非英语世界的注意力整块丢掉）、Google 是
  **10 个区域**可切；★ Google **没有中国大陆区域**（`geo=CN` 实测 400）——
  面板上写明了，读者找不到 CN 时有答案，而不是以为我们漏了。
- `newboards.test.js` 18 条（真实响应 fixture）。

### ③ 用户点名但**做不了**的（如实记，不硬上）

抖音 / 小红书 / 微信视频号 —— 无任何可用公开接口：抖音官方端点连接失败，
vvhan / tenapi / oioweb / cenguigui / xingzhige / 52vmy / pearktrue 等第三方聚合
全部"连接失败或返回 HTML 壳"，RSSHub 公共实例连不上。**没有数据通路，不是取舍**。
今日头条**站内已有**（13 个中文热榜里的 `toutiao`）；GitHub 新星榜也**已有**
（`repos` 面板的"本周"视图就是 `created:>7天前` 按星标排）。详见 docs §11-13 末节。

### 验证

- `npm test` 七组全绿（i18n 9 / ui 7 / theme 12 / trend 105 / ainews 16 /
  newboards 18 / site 45 = 212 条），`npm run build` 通过（15 个文件）。
- 无头实测：主题 18/18；三张新面板都渲染出真实数据（HN 20 行 / 维基 20 行 /
  Google 10 行），区域切换（US→HK→TW）、语种分组下拉（en 4 / zh 4 / ru 3 …）、
  中英双语页都跑通；截图确认暗/亮两套观感。
- [ ] 推送上线 + 线上实测（本轮尚未推 — `hnTop`/`wikiAttention`/`googleTrends`
      三份快照与 `hn-top.json` 等已入库，但**七份快照仍无每日 cron**
      （历史上 refresh-snapshots.yml 因 PAT 缺 workflow 权限一直没推上去），
      所以新老快照都会停在入库时刻）。

## 2026-10-16 · 第七轮：抖音 + 小红书热榜（37 → 39）+ 瀑布流改版

用户："样式不够美观和直接，你继续美化一下，然后加上小红书、视频号、抖音的热榜"。

### ① 三家点名的数据通路复测（此前记录为"做不了"）

- **抖音 ✅**：uapis 镜像 `…/hotboard?type=douyin`（50 条）+ 60s API `/v2/douyin` 备援；
- **小红书 ✅**：uapis 镜像 `?type=xiaohongshu`（20 条，无第二家镜像）；
- **视频号 ❌ 结论不变**：官方要登录态；uapis 全类型枚举里没有、60s 无此路由、
  tenapi 502、vvhan/pearktrue 域名不解析、RSSHub 超时、tophub 安全验证 403。
  **不硬造面板**，如实记录在 `docs/trend-sources.md` §14 与 README。
- 快照走独立文件 `video-boards.json`（与 cn-hot.json 同形），新脚本
  `scripts/fetch-video-boards.mjs`（`npm run snap:video`，已并入 `snap:all`）；
  面板复用 `loadHotList`（泛化出 `snapUrl`/`cacheKey` 参数，不另抄一份）。
- 实测三事实：条目落地页是**站内搜索页**；两家热度口径不同形（原始数字 vs
  "947.5w"）→ 统一格式化中文量级、解析不了保留原文；封面图不收。
- 测试：newboards.test.js +4（formatHotValue / normalizeItems / buildSnapshot /
  BOARDS 对齐），全套 216 条绿。

### ② 样式：单列纵排 → 主题段内瀑布流多列 + 视觉打磨

- `.topic-grid` 从 flex 纵排改成 **CSS 多列**（`columns: 3 340px`）：
  1440px→3 列 / 1024·768→2 列 / 390→1 列（CDP 四档实测），面板
  `break-inside: avoid` 不被劈开；无横向滚动。
- 视觉：页面 h1 渐变文字（clip:text，@supports 保底回落 ink）；页头与吸顶索引条
  改**半透明 + 毛玻璃浮层**（color-mix + backdrop-filter，双层同语言）；
  主题段标题加强调色竖条锚点；面板 hover 抬亮一档（`--surface-hover` 新变量，
  暗/亮各一档）；打印回单列。
- ★ **平滑滚动加上了又撤掉**：`html { scroll-behavior: smooth }` 在无头渲染里
  scrollIntoView 变成永不推进的动画（headless 不产生动画帧，scrollY 恒为 0）→
  懒加载观察器等不到面板进视口，中文/英文页全部卡在"加载中…"。真实浏览器
  不受影响，但本项目的验收手段就是无头实测，代价大于收益 —— 撤掉
  （`site.css` 里留了完整原因），其余打磨保留。
- `.wrap` 1100 → 1240（3 列的最小可行宽度）。
- 布局改动全部在 CSS，类名没动 —— site.test.js 的结构断言零改动通过。

### 验证

- `npm test` 216 条全绿；`npm run build` 通过（16 个文件，video-boards.json 入发布集）。
- 无头实测（CDP，撤掉平滑滚动之后）：中英两页的抖音/小红书面板滚到即出真实数据
  （抖音 20 行"英雄联盟S16…"1165.1万、小红书 20 行"用万能旅行拍照姿势…"947.5万）；
  四种视口（1440/1024/768/390）列数 3/2/2/1、无横向滚动，毛玻璃与渐变标题
  计算样式符合预期；亮色主题实测背景/文字正确。
- [ ] **待推送**：本轮（39 面板 + 瀑布流）与上一轮（hnTop/wikiAttention/googleTrends）
      都还未推送上线；线上仍是 34 面板的旧版。
- [ ] 快照每日 cron 仍未解决（PAT 缺 workflow 权限，见上一轮）——
      现在 `snap:all` 是**九**份快照，全都会停在入库时刻。
