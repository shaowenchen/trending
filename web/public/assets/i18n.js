/**
 * 双语字典 —— **所有面向访客的文案只有这一处来源**。
 *
 * ## 为什么不用"中英文字符串散在页面里 + 一个开关"
 * 页面骨架是**手写静态文件**（`web/public/*.html`），面板文案则全部由客户端
 * （`trend.js`）渲染。如果各自留一份文案，英文站点上线后必然出现
 * "英文页头 + 中文面板"这种半截状态，而且两边会越改越不一致。
 * 所以面板文案一律从这里取，页面骨架里的固定文案由人工保持双语一致。
 *
 * ## 为什么英文是独立目录（/en/）而不是页面上一个切换按钮
 * 前端切换只有一个 URL，搜索引擎只能收录一种语言，英文长尾流量拿不到。
 * 独立 URL 才能让两种语言各自被收录，也才能用 hreflang 明确声明
 * "这两个地址是同一页的两种语言"（避免被判成重复内容）。
 * 参数命名也用 `?lang=en` 这种形式**不做** —— 那会被当成同一个页面的参数版本。
 *
 * ## 页面骨架的文案为什么不进字典
 * 本站没有服务端，页面骨架的文案**直接写在各自的页面文件里**（两种语言的文案
 * 各写各的，不会把两种语言都塞进同一页再靠 CSS 藏）。字典这里只保留
 * **客户端要用的**键。
 *
 * ## 约定
 * - 键用点号分层；两种语言的键**必须完全一致**，缺键会在测试里直接报错。
 * - 中文是"原文"，英文是译文；两边都是给**访客**看的，注释不进字典。
 * - 这里的字符串**不含 HTML**。需要插值的用 `{name}` 占位，由 `t()` 替换。
 */

export const LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';

/**
 * ★ 关于 hreflang：本站**没有** hreflang（以及 canonical / og:url），
 * 这是有意去掉的，不是漏了：
 *
 *   这些标记里的地址**必须是绝对 URL**，而绝对地址只能来自"部署在哪里"。
 *   本站是纯静态、路径全用相对（见 README「为什么全是相对路径」），
 *   没有任何地方知道站点挂在 `https://<用户名>.github.io/<仓库>/`
 *   还是自定义域名的根下 —— 写死一个就等于把站点钉死在一个地址上。
 *
 * 代价是明确的：两个语言版本之间**没有**对搜索引擎的互译声明，
 * 内容结构相近的中英两页有可能被当成重复内容。换来的是"换个地址部署不用改代码"。
 * 要接回来的话，正确做法是构建时读一个 `SITE_URL` 环境变量再注入，
 * 而不是把域名写进代码。
 */

const zh = {
  // ── 面板标题 ──
  'p.trending.title': '正在流行的模型',
  'p.trending.hint': '按趋势分排序',
  'p.liked.title': '最受喜欢的模型',
  'p.liked.hint': '累计喜欢数',
  'p.downloaded.title': '下载最多的模型',
  'p.downloaded.hint': '累计下载数',
  'p.eval.title': '开源模型评测榜',
  'p.eval.hint': '取全部成绩后按平均分排序；上游数据源已归档，站内快照即最新全量',
  'p.aider.title': '编程能力榜（Aider Polyglot）',
  'p.aider.hint': '同一模型取最高的通过率',
  'p.spaces.title': '正在流行的 AI 应用',
  'p.spaces.hint': '按趋势分排序',
  'p.datasets.title': '正在流行的数据集',
  'p.datasets.hint': '按趋势分排序',
  'p.papers.title': '每日论文热榜',
  'p.papers.hint': '按点赞数排序',
  'p.aiNews.title': 'AI 新闻热点',
  'p.aiNews.hint': '八个来源的每日聚合快照：HN · dev.to · TechCrunch · The Verge · Latent Space · Interconnects · arXiv · lobste.rs',
  'p.aiPress.title': 'AI 官方要闻',
  'p.aiPress.hint': '八家一手信源官方博客的聚合快照：OpenAI · TechCrunch · Ars Technica · GitHub Blog · DeepMind · 微软研究院 · NVIDIA',
  'p.repos.title': '高星 AI 开源项目',
  'p.repos.hint': '按本周新增星标排序',
  'p.zhihu.title': '知乎热榜',
  'p.zhihu.hint': '知乎站内热度排序的问题榜',
  'p.csdn.title': 'CSDN 热榜',
  'p.csdn.hint': 'CSDN 技术社区热榜',
  'p.juejin.title': '掘金热榜',
  'p.juejin.hint': '掘金技术社区热榜',
  'p.itzhijia.title': 'IT之家热榜',
  'p.itzhijia.hint': 'IT之家科技资讯热榜',
  'p.huxiu.title': '虎嗅热榜',
  'p.huxiu.hint': '虎嗅科技商业热榜',
  'p.aifaner.title': '爱范儿热榜',
  'p.aifaner.hint': '爱范儿科技媒体热榜',
  'p.zhongguancun.title': '中关村在线热榜',
  'p.zhongguancun.hint': '中关村在线硬件资讯热榜',
  'p.bilibili.title': 'B站热榜',
  'p.bilibili.hint': 'B站热门视频榜',
  'p.weibo.title': '微博热搜',
  'p.weibo.hint': '微博站内热搜榜',
  'p.toutiao.title': '今日头条热榜',
  'p.toutiao.hint': '今日头条站内热榜',
  'p.hupu.title': '虎扑步行街热榜',
  'p.hupu.hint': '虎扑步行街热帖榜',
  'p.douban.title': '豆瓣热话',
  'p.douban.hint': '豆瓣热门话题',
  'p.zhidemai.title': '值得买热榜',
  'p.zhidemai.hint': '值得买 3 小时热门促销榜',
  // 视频/生活方式热榜（uapis 镜像快照，见 fetch-video-boards.mjs）。
  // hint 里写明"搜索页"：热榜条目没有单独落地页，链接指向站内搜索是事实。
  'p.douyin.title': '抖音热榜',
  'p.douyin.hint': '抖音站内实时热搜，条目指向站内搜索页',
  'p.xiaohongshu.title': '小红书热榜',
  'p.xiaohongshu.hint': '小红书站内热搜，条目指向站内搜索页',
  'p.baidu.title': '百度热搜',
  'p.baidu.hint': '百度搜索的实时热搜榜',
  'p.v2ex.title': 'V2EX 热帖',
  'p.v2ex.hint': 'V2EX 技术社区的热门主题',
  'p.qqnews.title': '腾讯新闻热点',
  'p.qqnews.hint': '腾讯新闻的实时热点榜',
  'p.kuaishou.title': '快手热榜',
  'p.kuaishou.hint': '快手站内实时热搜',
  'p.ghTrending.title': 'GitHub Trending（AI 过滤）',
  'p.ghTrending.hint': 'github.com/trending 每日榜的构建期快照；只收 AI 相关仓库',
  'p.newmodels.title': '最新发布的模型',
  'p.newmodels.hint': '数据较大（约 4.8MB），进页面即加载',
  'p.openrouter.title': 'OpenRouter 模型用量榜',
  'p.openrouter.hint': '按 token 用量排序，日更；standard / batch / free 三种变体已合并',
  'p.orCatalog.title': 'OpenRouter 模型库',
  'p.orCatalog.hint': '全部可路由模型：价格、上下文、模态与上线时间，按上线时间排序',
  'p.orTrends.title': 'OpenRouter 上升榜',
  'p.orTrends.hint': '按周环比增幅排序（本周 vs 上周 token 用量）',
  'p.orTrends.climbing': '上升榜',
  'p.orTrends.breakouts': '突破榜',
  'p.orAuthors.title': 'OpenRouter 厂商份额',
  'p.orAuthors.hint': '各机构在 OpenRouter 上的 token 份额与周环比变化',
  'p.orPerf.title': 'OpenRouter 性能榜',
  'p.orPerf.hint': '各模型在 OpenRouter 上的实测中位延迟与吞吐（按 provider 取最优）',
  'p.orPerf.latency': '延迟',
  'p.orPerf.throughput': '吞吐',
  'p.aaBench.title': 'Artificial Analysis 评测榜',
  'p.aaBench.hint': '与 HuggingFace 评测榜**不同来源**，可并列对照',
  'p.aaBench.intelligence': '综合智能',
  'p.aaBench.coding': '编程',
  'p.aaBench.agentic': '智能体',
  'p.orApps.title': 'OpenRouter 应用榜',
  'p.orApps.hint': '哪些应用在烧 token（按 agent 应用归因），以及图像/视频/语音模型的用量',
  'p.orApps.day': '应用 · 本日',
  'p.orApps.week': '应用 · 本周',
  'p.orApps.image': '图像模型',
  'p.orApps.video': '视频模型',
  'p.orApps.audio': '语音模型',
  'p.swebench.title': 'SWE-bench（真实代码修复）',
  'p.swebench.hint': '数据较大（约 4MB），进页面即加载',

  // ── 2026-10-16 新增三张榜 ──
  'p.hnTop.title': 'Hacker News 首页',
  'p.hnTop.hint': '技术社区此刻在顶什么（与「AI 新闻」里的 HN 源口径不同：那个按 AI 关键词搜，这个就是整个首页）',
  'p.wikiAttention.title': '维基百科 AI 词条关注度',
  'p.wikiAttention.hint': '8 个语种维基里 AI 词条的真实浏览量 —— 全站唯一的大众注意力口径，不是技术圈热度；浏览量是 UTC 前一日的',
  'p.googleTrends.title': 'Google 搜索趋势',
  'p.googleTrends.hint': '美国区的每日搜索热词（Google 官方日榜）',

  // ── 标签（`boards.js` 的 slug → 面向访客的文字）──
  // slug 进地址（`tag.html?t=models`，两种语言共用）；这里只放**显示文字**，
  // 所以中文站显示"模型榜"、英文站显示"Models"，而地址始终是同一个。
  // 主题四类互不重叠，每个榜恰好一个 —— 见 `boards.js` 的 BOARD_TAGS。
  'tag.models': '模型榜',
  'tag.benchmarks': '评测榜',
  'tag.ecosystem': '社区生态',
  'tag.platform': '平台洞察',
  'tag.news': '资讯',
  'tag.cn-hot': '中文热榜',
  'tag.huggingface': 'HuggingFace',
  'tag.aider': 'Aider',
  'tag.github': 'GitHub',
  'tag.models-dev': 'models.dev',
  'tag.openrouter': 'OpenRouter',
  'tag.artificial-analysis': 'Artificial Analysis',
  'tag.swe-bench': 'SWE-bench',
  // 资讯两张榜都是多源聚合，没有单一来源方 —— 单独一个来源标签
  'tag.aggregator': '多源聚合',
  // HN 首页实况是单一来源（Hacker News 自己）
  'tag.hackernews': 'Hacker News',
  // 大众注意力两榜的来源
  'tag.wikipedia': '维基百科',
  'tag.google': 'Google',
  // 13 个中文热榜各自的平台（点它筛出该平台那一个榜）
  'tag.zhihu': '知乎',
  'tag.csdn': 'CSDN',
  'tag.juejin': '掘金',
  'tag.itzhijia': 'IT之家',
  'tag.huxiu': '虎嗅',
  'tag.aifaner': '爱范儿',
  'tag.zhongguancun': '中关村在线',
  'tag.bilibili': 'B站',
  'tag.weibo': '微博',
  'tag.toutiao': '今日头条',
  'tag.hupu': '虎扑',
  'tag.douban': '豆瓣',
  'tag.zhidemai': '值得买',
  'tag.douyin': '抖音',
  'tag.xiaohongshu': '小红书',
  'tag.baidu': '百度',
  'tag.v2ex': 'V2EX',
  'tag.qqnews': '腾讯新闻',
  'tag.kuaishou': '快手',

  // ── 列名 / 字段名 ──
  'col.rank': '#',
  'col.model': '模型',
  'col.app': '应用',
  'col.dataset': '数据集',
  'col.paper': '论文',
  'col.repo': '仓库',
  'col.task': '任务',
  'col.sdk': 'SDK',
  'col.lang': '语言',
  'col.org': '机构',
  'col.provider': '服务商',
  'col.date': '日期',
  'col.release': '发布日期',
  'col.submitted': '提交日期',
  'col.avg': '平均',
  'col.score': '解决率',
  'col.rate': '通过率',
  'col.params': '参数(B)',
  'col.context': '上下文',
  'col.priceIn': '输入价',
  'col.priceOut': '输出价',
  'col.cost': '成本',
  'col.votes': '点赞',
  'col.likes': '喜欢',
  'col.downloads': '下载',
  // OpenRouter 面板专用：它是唯一按 **token 用量**口径的榜
  'col.orTokens': 'Token 用量',
  'col.orShare': '占比',
  'col.orRequests': '请求数',
  'col.orGrowth': '周环比',
  'col.orWeekTokens': '本周 token',
  'col.orPrevWeek': '上周 token',
  'col.orLatency': '延迟',
  'col.orThroughput': '吞吐',
  'col.orReqCount': '请求数',
  'col.orProvider': '最快 provider',
  'col.stars': '总星标',
  'col.title': '标题',
  'col.source': '来源',
  'col.hot': '热度',
  'col.starsToday': '今日新增星',
  // 2026-10-16 新增三张榜的列
  'col.comments': '评论',
  'col.views': '浏览量',
  'col.keyword': '热搜词',
  'col.news': '相关新闻',
  'col.wikiTrend': '7 日走势',
  'col.desc': '描述',
  'col.modality': '模态',
  'col.gained': '本期新增',
  'col.trending': '趋势分',
  'col.weekStars': '本周新增星标',

  // ── 交互控件 ──
  'ui.search': '搜索…',
  'ui.searchModels': '按模型名搜索…',
  // OpenRouter 面板：清单（/api/v1/models，464 个对话模型）覆盖不到的那部分
  // 用量行（音频/视频/embedding 等）拿不到显示名，只能显示 slug —— 标一下，
  // 免得读者以为那一行本来就是这么写的
  'ui.orSlugOnly': '无显示名',
  'ui.orImages': '张图像',
  'ui.orHours': '小时视频',
  'ui.orChars': '字符',
  'ui.searchApps': '按应用名搜索…',
  'ui.searchDatasets': '按数据集名搜索…',
  'ui.searchPapers': '按标题搜索…',
  'ui.searchModelsProviders': '按模型或服务商搜索…',
  'ui.searchModelsOrgs': '按模型或机构搜索…',
  'ui.searchRepos': '按仓库名或描述搜索…',
  'ui.searchNews': '按标题或来源搜索…',
  // HN 首页：区分外链与自帖（Ask/Show HN 没有外部地址，落点是讨论页）
  'ui.hnExternal': '外链',
  'ui.hnDiscuss': '讨论',
  // Google 趋势：中国大陆没有这个区域（geo=CN 实测 400），说明一句免得读者以为漏了
  'ui.allSources': '全部来源',
  'ui.allGroups': '全部分组',
  'ui.allTasks': '全部任务',
  'ui.allSdks': '全部 SDK',
  'ui.allLangs': '全部语言',
  'ui.allOrgs': '全部机构',
  'ui.allProviders': '全部服务商',
  'ui.noData': '没有数据',
  'ui.loading': '加载中…',
  // 单面板页的页脚导航（由 trend.js 生成，不写进页面骨架）
  'ui.boardNav': '切换面板',
  'ui.boardTags': '本页标签：',
  'ui.sortHint': '点击排序',
  'ui.free': '免费',

  // ── 主题切换（页头那个按钮的三态）──
  // 三态而不是两态：见 assets/theme.js 顶部 —— "跟随系统"必须是一个能回去的
  // 状态，不是"没选过"的残留。
  'theme.name': '主题',
  'theme.system': '跟随系统',
  'theme.light': '亮色',
  'theme.dark': '暗色',
  'theme.hint': '主题：{next}（点一下切换）',

  // ── 列表与状态 ──
  'ui.loaded': '{n} 个',

  // ── 面板状态 ──
  'st.fetching': '正在拉取…',
  'st.fetchingPages': '正在按页拉取全量成绩（限速拉取，首次约需 30–60 秒）…',
  'st.progress': '已取 {got} 行 · {done}/{total} 页',
  'st.progressFailed': '已取 {got} 行 · {done}/{total} 页 · {failed} 页失败',
  'st.evalDonePartial': '{n} 个模型 · 覆盖 {pages} 页（{failed} 页失败，可能不完整）· 抓取于 {time}',
  // 上游整个读不动时回退旧快照的说明：如实标"这是什么时候抓的、有多少"，不装成新数据
  'st.evalStale': '本次没取到（{msg}）—— 显示 {time} 抓取的旧快照：{n} 个模型，可能不完整',
  // 面板底部统一只有这一行（2026-10-21 按 owner 要求：底部不要太多信息）。
  // 旧的"共 N 条 · 构建期快照 · 抓取于 … · 条目链接指向原平台 / 来源 …"整串退役
  // —— 条数看列表自明，"是快照""链接去哪"在面板说明（hint）里。
  'st.updated': '数据更新于 {time}',
  'st.staleSnap': '本次没取到（{msg}）—— 显示 {time} 抓取的旧快照，可能已过时',
  'st.pressSkipped': '观察项：{names}',
  'st.failed': '读取失败：{msg}',
  // 2026-10-19 每日视图（未选中任何榜时的默认落点：名言 + 历史上的今天）
  'daily.quoteTitle': '名人名言',
  'daily.next': '换一句',
  'daily.historyTitle': '历史上的今天',
  'daily.historyNote': '图文快照 · {date} · 来源维基百科',
  'daily.empty': '今天的数据还没抓到。',
  'daily.pickHint': '请从上方索引选择一个榜单 →',
  'st.bigDataHint': '点击下方按钮加载（该源数据较大，避免进页面就拉）',
  'st.loadingBig': '正在拉取 {size} 数据…',
  // OpenRouter 状态行（数据每天更新，读者要能判断"这是哪一天的榜"）
  'st.orTotal': '{date} 全平台 token 用量 {total}',
  'st.loadSwe': '加载 SWE-bench 榜',
  'st.loadModels': '加载最新发布模型',
  'st.rateLimited': '（上游接口不可用、跨域被拦或限流）',
  'st.distinct': '同模型取最高分',

  // ── 错误 ──
  'err.notArray': '上游返回的不是数组',
  'err.noItems': '上游返回结构里没有 items',
  'err.noRows': '返回结构里没有 rows',
  'err.noBoard': '没有解析出任何有效成绩',
  'err.noModels': '没有解析出任何模型',
  'err.noPapers': '没有解析出任何论文',
  'err.noRepos': '没有解析出任何仓库',
  'err.noNews': '快照里没有解析出新闻',
  'err.noBoardRows': '子榜 {name} 里没有解析出成绩',
  'err.yamlSubset': '第 {line} 行超出最小 YAML 子集：{text}',
  'err.yamlNested': '第 {line} 行是嵌套映射（键 {key} 没有值），超出最小 YAML 子集',
  'err.yamlIndent': '第 {line} 行缩进过深（疑似嵌套映射），超出最小 YAML 子集',
  'err.yamlNotKV': '第 {line} 行不是 "键: 值"：{text}',
  'err.yamlChanged': '（上游改了写法，本面板需同步）',
  'err.evalFirst': '评测榜第一页就没取到，无法得知总页数（与其显示一个残榜，不如明说拿不到）',
  'err.noBoards': '返回结构里没有子榜',
  'st.ghLimit': '（GitHub 匿名搜索限流 10 次/分钟，等一分钟或换个网络再试）',
  'st.retry': '，可点下方按钮重试',
  'st.retryRefresh': '，可用页面底部的「刷新数据」重试',
  // ★ 上面这五个键原本**只被 trend.js 引用、字典里没有**：取到的是键名本身，
  //   也就是说线上错误提示曾经直接显示 "err.evalFirst" 这种字符串。
  //   翻译自检（两种语言键一致）抓不到它 —— 它俩"一致地都缺"。
  //   web/public/assets/site.test.js 里加了一条"每个被引用的键都存在"的断言，
  //   这类漏配以后会在本地暴露，而不是等到用户看见英文键名。
  'err.init': '面板初始化失败：{msg}',
  // ★ 这一条几乎总是**旧缓存**：页面按新代码发出去、脚本还是上一次构建的那份时，
  //   就会出现"页面指名了一个老脚本不认识的 panel"。所以先把这条最可能的原因写在前面，
  //   并给出**读者能自己做**的动作 —— 原来的措辞只对开发者有意义。
  'err.unknownBoard':
    '本页面指名了一个不存在的面板：{id}。\n（最可能是页面脚本是旧缓存 —— 刷新一下本页（Cmd/Ctrl+Shift+R）多半就好；若仍然如此，则是页面上的 data-board 写错、或面板 id 改过而白名单/导航没跟着改）',

  // ── 这一版删掉的键（留着注释是为了让"原文案去哪了"有答案）──
  // 曾有 site.* / nav.* / hero.title|sub|refresh|enter / home.* / footer.sources
  // 等键，它们只服务于**页面骨架**。本站的骨架是手写静态文件（没有构建期之外的
  // 注入层），所以这些键没有调用方，按"字典里不留死键"的既有规矩删掉。
  // 2026-10-20：hero.refreshing 与 ui.refresh 随主题段「刷新」按钮一起删掉
  // （数据由定时任务每 2 小时刷站内快照，页面不再提供重新拉取的入口）。
};

const en = {
  'p.trending.title': 'Trending models',
  'p.trending.hint': 'sorted by trending score',
  'p.liked.title': 'Most-liked models',
  'p.liked.hint': 'total likes',
  'p.downloaded.title': 'Most-downloaded models',
  'p.downloaded.hint': 'total downloads',
  'p.eval.title': 'Open-model evaluation board',
  'p.eval.hint': 'all raw scores fetched, then sorted by average; the upstream source is archived, the on-site snapshot is the latest full list',
  'p.aider.title': 'Coding ability (Aider Polyglot)',
  'p.aider.hint': 'best pass rate per model',
  'p.spaces.title': 'Trending AI apps',
  'p.spaces.hint': 'sorted by trending score',
  'p.datasets.title': 'Trending datasets',
  'p.datasets.hint': 'sorted by trending score',
  'p.papers.title': 'Daily paper leaderboard',
  'p.papers.hint': 'sorted by upvotes',
  'p.aiNews.title': 'AI news roundup',
  'p.aiNews.hint': 'Daily aggregate snapshot of 8 sources: HN · dev.to · TechCrunch · The Verge · Latent Space · Interconnects · arXiv · lobste.rs',
  'p.aiPress.title': 'AI official news',
  'p.aiPress.hint': 'Build-time snapshot of 8 first-party sources: OpenAI, TechCrunch, Ars Technica, GitHub Blog, DeepMind, Microsoft Research, NVIDIA',
  'p.repos.title': 'Top-starred AI projects',
  'p.repos.hint': 'sorted by stars gained this week',
  'p.zhihu.title': 'Zhihu hot list',
  'p.zhihu.hint': 'Hottest questions on Zhihu',
  'p.csdn.title': 'CSDN hot list',
  'p.csdn.hint': 'Hot posts on the CSDN developer community',
  'p.juejin.title': 'Juejin hot list',
  'p.juejin.hint': 'Hot posts on the Juejin developer community',
  'p.itzhijia.title': 'ITHome hot list',
  'p.itzhijia.hint': 'Hot tech stories on ITHome',
  'p.huxiu.title': 'Huxiu hot list',
  'p.huxiu.hint': 'Hot tech-business stories on Huxiu',
  'p.aifaner.title': 'Ifanr hot list',
  'p.aifaner.hint': 'Hot stories on Ifanr',
  'p.zhongguancun.title': 'ZOL hot list',
  'p.zhongguancun.hint': 'Hot hardware stories on ZOL',
  'p.bilibili.title': 'Bilibili hot list',
  'p.bilibili.hint': 'Hot videos on Bilibili',
  'p.weibo.title': 'Weibo trending',
  'p.weibo.hint': 'Trending topics on Weibo',
  'p.toutiao.title': 'Toutiao hot list',
  'p.toutiao.hint': 'Trending stories on Toutiao',
  'p.hupu.title': 'Hupu hot list',
  'p.hupu.hint': 'Hot threads on Hupu',
  'p.douban.title': 'Douban hot topics',
  'p.douban.hint': 'Hot topics on Douban',
  'p.zhidemai.title': 'Smzdm hot deals',
  'p.zhidemai.hint': 'Hot deals on Smzdm (3-hour window)',
  // Video / lifestyle hot lists (uapis mirror snapshot; see fetch-video-boards.mjs)
  'p.douyin.title': 'Douyin hot list',
  'p.douyin.hint': 'real-time trending searches on Douyin; items link to in-app search pages',
  'p.xiaohongshu.title': 'Xiaohongshu hot list',
  'p.xiaohongshu.hint': 'trending searches on Xiaohongshu (RED); items link to in-app search pages',
  'p.baidu.title': 'Baidu hot searches',
  'p.baidu.hint': 'real-time trending searches on Baidu',
  'p.v2ex.title': 'V2EX hot topics',
  'p.v2ex.hint': 'popular threads on the V2EX tech community',
  'p.qqnews.title': 'Tencent News trending',
  'p.qqnews.hint': 'real-time trending stories on Tencent News',
  'p.kuaishou.title': 'Kuaishou hot list',
  'p.kuaishou.hint': 'real-time trending searches on Kuaishou',
  'p.ghTrending.title': 'GitHub Trending (AI filter)',
  'p.ghTrending.hint': 'build-time snapshot of the daily github.com/trending list; AI-related repos only',
  'p.newmodels.title': 'Latest model releases',
  'p.newmodels.hint': 'large payload (~4.8MB), loads on page open',
  'p.openrouter.title': 'OpenRouter model usage',
  'p.openrouter.hint': 'ranked by token usage, updated daily; standard / batch / free variants merged',
  'p.orCatalog.title': 'OpenRouter model catalog',
  'p.orCatalog.hint': 'every routable model: pricing, context, modality and release date, newest first',
  'p.orTrends.title': 'OpenRouter fastest climbers',
  'p.orTrends.hint': 'ranked by week-over-week growth (this week vs last, in tokens)',
  'p.orTrends.climbing': 'Climbing',
  'p.orTrends.breakouts': 'Breakouts',
  'p.orAuthors.title': 'OpenRouter vendor share',
  'p.orAuthors.hint': 'each vendor\'s share of OpenRouter tokens, with week-over-week change',
  'p.orPerf.title': 'OpenRouter performance',
  'p.orPerf.hint': 'measured median latency and throughput per model (best provider)',
  'p.orPerf.latency': 'Latency',
  'p.orPerf.throughput': 'Throughput',
  'p.aaBench.title': 'Artificial Analysis benchmarks',
  'p.aaBench.hint': 'a **different source** from the HuggingFace board — compare the two side by side',
  'p.aaBench.intelligence': 'Intelligence',
  'p.aaBench.coding': 'Coding',
  'p.aaBench.agentic': 'Agentic',
  'p.orApps.title': 'OpenRouter app usage',
  'p.orApps.hint': 'which apps are burning tokens (attributed per agent app), plus image/video/speech models',
  'p.orApps.day': 'Apps · day',
  'p.orApps.week': 'Apps · week',
  'p.orApps.image': 'Image models',
  'p.orApps.video': 'Video models',
  'p.orApps.audio': 'Speech models',
  'p.swebench.title': 'SWE-bench (real code fixes)',
  'p.swebench.hint': 'large payload (~4MB), loads on page open',

  // ── Three boards added 2026-10-16 ──
  'p.hnTop.title': 'Hacker News front page',
  'p.hnTop.hint': 'what the tech community is upvoting right now (a different cut from the HN source inside AI news: that one searches AI keywords, this is the whole front page)',
  'p.wikiAttention.title': 'Wikipedia attention on AI topics',
  'p.wikiAttention.hint': 'real pageviews of AI articles across 8 Wikipedia languages — the only general-public attention signal on this site, not tech-community heat; views are the previous UTC day',
  'p.googleTrends.title': 'Google search trends',
  'p.googleTrends.hint': "daily search trends for the US (Google's official daily list)",

  // ── Tag labels (slug → what the visitor reads; see the zh block above) ──
  'tag.models': 'Models',
  'tag.benchmarks': 'Benchmarks',
  'tag.ecosystem': 'Ecosystem',
  'tag.platform': 'Platform',
  'tag.news': 'News',
  'tag.cn-hot': 'Chinese hot lists',
  'tag.huggingface': 'HuggingFace',
  'tag.aider': 'Aider',
  'tag.github': 'GitHub',
  'tag.models-dev': 'models.dev',
  'tag.openrouter': 'OpenRouter',
  'tag.artificial-analysis': 'Artificial Analysis',
  'tag.swe-bench': 'SWE-bench',
  'tag.aggregator': 'Multi-source',
  // HN front page is a single source (Hacker News itself)
  'tag.hackernews': 'Hacker News',
  // The two general-public attention boards
  'tag.wikipedia': 'Wikipedia',
  'tag.google': 'Google',
  'tag.zhihu': 'Zhihu',
  'tag.csdn': 'CSDN',
  'tag.juejin': 'Juejin',
  'tag.itzhijia': 'ITHome',
  'tag.huxiu': 'Huxiu',
  'tag.aifaner': 'Ifanr',
  'tag.zhongguancun': 'ZOL',
  'tag.bilibili': 'Bilibili',
  'tag.weibo': 'Weibo',
  'tag.toutiao': 'Toutiao',
  'tag.hupu': 'Hupu',
  'tag.douban': 'Douban',
  'tag.zhidemai': 'Smzdm',
  'tag.douyin': 'Douyin',
  'tag.xiaohongshu': 'Xiaohongshu',
  'tag.baidu': 'Baidu',
  'tag.v2ex': 'V2EX',
  'tag.qqnews': 'Tencent News',
  'tag.kuaishou': 'Kuaishou',

  'col.rank': '#',
  'col.model': 'Model',
  'col.app': 'App',
  'col.dataset': 'Dataset',
  'col.paper': 'Paper',
  'col.repo': 'Repo',
  'col.task': 'Task',
  'col.sdk': 'SDK',
  'col.lang': 'Language',
  'col.org': 'Org',
  'col.provider': 'Provider',
  'col.date': 'Date',
  'col.release': 'Released',
  'col.submitted': 'Submitted',
  'col.avg': 'Average',
  'col.score': 'Resolved',
  'col.rate': 'Pass rate',
  'col.params': 'Params (B)',
  'col.context': 'Context',
  'col.priceIn': 'Input $',
  'col.priceOut': 'Output $',
  'col.cost': 'Cost',
  'col.votes': 'Upvotes',
  'col.likes': 'Likes',
  'col.downloads': 'Downloads',
  // OpenRouter board only: the one board measured in **tokens consumed**
  'col.orTokens': 'Tokens',
  'col.orShare': 'Share',
  'col.orRequests': 'Requests',
  'col.orGrowth': 'WoW change',
  'col.orWeekTokens': 'tokens this week',
  'col.orPrevWeek': 'tokens last week',
  'col.orLatency': 'Latency',
  'col.orThroughput': 'Throughput',
  'col.orReqCount': 'Requests',
  'col.orProvider': 'fastest provider',
  'col.stars': 'Stars',
  'col.title': 'Title',
  'col.source': 'Source',
  'col.hot': 'Score',
  'col.starsToday': 'Stars today',
  // Columns for the three boards added 2026-10-16
  'col.comments': 'Comments',
  'col.views': 'Views',
  'col.keyword': 'Search term',
  'col.news': 'Related news',
  'col.wikiTrend': '7-day trend',
  'col.desc': 'Description',
  'col.modality': 'Modality',
  'col.gained': 'Gained',
  'col.trending': 'Trending',
  'col.weekStars': 'Stars this week',

  'ui.search': 'Search…',
  'ui.searchModels': 'Search models…',
  // OpenRouter board: usage rows the model catalogue (464 chat models) does not
  // cover — audio/video/embedding — have no display name, so they show a slug.
  'ui.orSlugOnly': 'slug only',
  'ui.orImages': 'images',
  'ui.orHours': 'video hours',
  'ui.orChars': 'characters',
  'ui.searchApps': 'Search apps…',
  'ui.searchDatasets': 'Search datasets…',
  'ui.searchPapers': 'Search titles…',
  'ui.searchModelsProviders': 'Search models or providers…',
  'ui.searchModelsOrgs': 'Search models or orgs…',
  'ui.searchRepos': 'Search repo name or description…',
  'ui.searchNews': 'Search headlines or sources…',
  // HN front page: tell external links from self-posts (Ask/Show HN have no
  // external URL, so the row points at the discussion page)
  'ui.hnExternal': 'Link',
  'ui.hnDiscuss': 'Discussion',
  // Google Trends: mainland China has no region here (geo=CN returns 400),
  // say so instead of letting readers think we simply missed it
  'ui.allSources': 'All sources',
  'ui.allGroups': 'All groups',
  'ui.allTasks': 'All tasks',
  'ui.allSdks': 'All SDKs',
  'ui.allLangs': 'All languages',
  'ui.allOrgs': 'All orgs',
  'ui.allProviders': 'All providers',
  'ui.noData': 'No data',
  'ui.loading': 'Loading…',
  // Footer navigation on single-board pages (built by trend.js)
  'ui.boardNav': 'Switch board',
  'ui.boardTags': 'Tags on this board:',
  'ui.sortHint': 'Click to sort',
  'ui.free': 'Free',

  // Theme toggle (three states on the header button)
  'theme.name': 'Theme',
  'theme.system': 'system',
  'theme.light': 'light',
  'theme.dark': 'dark',
  'theme.hint': 'Theme: {next} (click to switch)',

  'ui.loaded': '{n} models',

  'st.fetching': 'Loading…',
  'st.fetchingPages': 'Fetching all scores page by page (rate-limited; first visit may take 30–60 s)…',
  'st.progress': '{got} rows · {done}/{total} pages',
  'st.progressFailed': '{got} rows · {done}/{total} pages · {failed} failed',
  'st.evalDonePartial': '{n} models · {pages} pages ({failed} failed, may be incomplete) · fetched {time}',
  // Shown when the upstream is unreachable and we fall back to the last snapshot
  'st.evalStale': 'Fetch failed ({msg}) — showing the snapshot fetched {time}: {n} models, may be incomplete',
  // The panel footer is this single line (2026-10-21, owner: keep the bottom lean).
  'st.updated': 'Data updated {time}',
  'st.staleSnap': 'Fetch failed ({msg}) — showing the snapshot fetched {time}, may be out of date',
  'st.pressSkipped': 'watch list: {names}',
  'st.failed': 'Failed: {msg}',
  // Daily view (the default landing when no board is selected: quotes + on this day)
  'daily.quoteTitle': 'Quotes',
  'daily.next': 'Another one',
  'daily.historyTitle': 'On this day',
  'daily.historyNote': 'snapshot · {date} · source: Wikipedia',
  'daily.empty': 'Today\'s data is not fetched yet.',
  'daily.pickHint': 'Select a board from the index above →',
  'st.bigDataHint': 'Click the button below to load (large payload — kept out of first paint)',
  'st.loadingBig': 'Fetching {size}…',
  // OpenRouter status line: the data is daily, so the reader needs to know which day they see
  'st.orTotal': '{total} tokens across OpenRouter on {date}',
  'st.loadSwe': 'Load SWE-bench board',
  'st.loadModels': 'Load latest releases',
  'st.rateLimited': '(source unavailable, blocked by CORS, or rate-limited)',
  'st.distinct': 'best score per model',

  'err.notArray': 'Source did not return an array',
  'err.noItems': 'Source response has no items',
  'err.noRows': 'Response has no rows',
  'err.noBoard': 'No valid scores parsed',
  'err.noModels': 'No models parsed',
  'err.noPapers': 'No papers parsed',
  'err.noRepos': 'No repositories parsed',
  'err.noNews': 'No news items parsed from the snapshot',
  'err.noBoardRows': 'No scores parsed from the {name} board',
  'err.yamlSubset': 'Line {line} is outside the minimal YAML subset: {text}',
  'err.yamlNested': 'Line {line} is a nested mapping ({key} has no value), outside the minimal YAML subset',
  'err.yamlIndent': 'Line {line} is indented too deep (looks nested), outside the minimal YAML subset',
  'err.yamlNotKV': 'Line {line} is not "key: value": {text}',
  'err.yamlChanged': '(the source changed its format — this panel needs updating)',
  'err.evalFirst':
    'The first page of the evaluation board could not be fetched, so the total page count is unknown (better to say so than to show a truncated board).',
  'err.noBoards': 'Response has no sub-boards',
  'st.ghLimit': '(GitHub anonymous search is limited to 10 req/min — wait a minute or switch network)',
  'st.retry': ', or click the button below to retry',
  'st.retryRefresh': ', or retry with the Refresh button at the bottom of the page',
  'err.init': 'Panel failed to initialise: {msg}',
  'err.unknownBoard':
    'This page names a board that does not exist: {id}.\n(Most likely the page script is a stale cache — a hard refresh (Cmd/Ctrl+Shift+R) usually fixes it. If not, the page\'s data-board is misspelled, or a board id changed without updating the whitelist and navigation.)',
};

export const DICT = { zh, en };

/**
 * 取一条文案，并替换 `{name}` 占位符。
 *
 * 缺键时**返回键名本身**（例如 `p.eval.title`）而不是空串或 undefined：
 * 空串会让页面上出现一个看不出问题的空标题，而键名一眼就知道是漏配。
 * 另外 `__tests__` 里有一条断言要求两种语言的键完全一致，正常不会走到这里。
 */
export function t(locale, key, vars = {}) {
  const dict = DICT[locale] || DICT[DEFAULT_LOCALE];
  const s = dict[key] ?? DICT[DEFAULT_LOCALE][key] ?? key;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k])));
}

/** 某个语言下的全部键（测试用来对齐两种语言） */
export function keysOf(locale) {
  return Object.keys(DICT[locale] || {});
}

/**
 * 标签 slug 在当前语言下的显示文字。
 *
 * 缺键时 `t()` 会返回 `tag.<slug>` 本身（一眼能看出漏配，而不是空白）——
 * `site.test.js` 另有一条断言要求每个 slug 在两种语言下都有名字。
 */
export function tagLabel(slug, locale = DEFAULT_LOCALE) {
  return t(locale, `tag.${slug}`);
}

