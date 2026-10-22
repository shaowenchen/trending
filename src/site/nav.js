/**
 * 页头导航与**首页的粘性索引条** —— 都是**构建期**生成，页面里写占位符。
 *
 * ## 页头只有两样：左边品牌名（趋势大盘），右边切换语言
 * 榜单**不进页头**：扁平站之后全部 39 个面板都在首页上，页头再列一遍就是同一份
 * 目录的第二次出现。原来还有第三个「标签」入口 —— 它指向的 `tags.html` /
 * `tag.html` 两个页面已经删掉（标签改为就地筛选），所以这一项也没了。
 *
 * ## 首页正文由 `renderIndex` 生成：一条粘性索引条
 * 一行**把 39 个面板平铺出来**（点一个只看那一个，再点一次回到全部），
 * 下面一行一个「刷新数据」按钮。面板骨架本身由 `trend.js` 在运行时铺
 * （数据要按语言取 `i18n.js`），构建期只落这条**导航**。
 *
 * ## 为什么不写进页面文件
 * 索引条里每条都带文案（中/英）与 href，手写就是两份副本 —— 而"抄两份"的失效
 * 方式是具体的：加一个面板时漏改一处，那个榜就没有入口。真值只有 `boards.js`
 * （面板 id + 主题 + 来源）与 `i18n.js`（文案），这里只是把它们渲染成 HTML。
 *
 * ## 为什么在构建期而不是客户端
 *   · 与 `{{GTM}}` / `{{THEME_BOOT}}` 同一套机制，不新增一层；
 *   · **无 JS 也能用**：导航是页面骨架的一部分，本来就该在没有脚本时也可读
 *     （客户端渲染的导航在禁用 JS 时是整条消失）；
 *   · 链接是静态的相对路径，构建期就能被 `findMissingAssets` 校验。
 *
 * ## 语言与路径
 * 两种语言的页面在各自的目录里（`/` 与 `/en/`），所以同一份导航要落成两套
 * 相对路径：中文页的首页是 `index.html`，英文页是 `../index.html`。
 * 这正是 `lang` 参数的唯一作用。
 *
 * 页面骨架的文案不进 `i18n.js` 字典（那是给客户端用的，见该文件顶部说明），
 * 所以导航的文案在这里自带一份 —— 与页面里其它骨架文案是同样的处理方式。
 */

/** 占位符，由 `scripts/build-site.mjs` 替换。 */
export const NAV_PLACEHOLDER = '{{SITE_NAV}}';

/**
 * 骨架文案 —— 页头导航与索引条里的固定词。面板名走 `i18n.js`
 * （它们本来就是客户端渲染的 `p.<id>.title`），这里只放几条**结构性**文案。
 */
const NAV_TEXT = {
  zh: {
    // 左上角放**品牌名**而不是「首页」（2026-10-20 晚，owner 要求）——
    // 扁平站每个页面都是首页，「首页」两个字不携带信息；品牌名同时是
    // 回首页的链接，一个字顶两个用。与 <title>/内容 h1 同词。
    home: '趋势大盘',
    label: '站点导航',
    toggle: '切换语言：',
    switchTo: 'English',
    themeName: '主题',
    themeHint: '主题：{name}（点一下切换）',
    indexLabel: '榜单索引',
  },
  en: {
    home: 'Trend boards',
    label: 'Site navigation',
    toggle: 'Switch language: ',
    switchTo: '中文',
    themeName: 'Theme',
    themeHint: 'Theme: {name} (click to switch)',
    indexLabel: 'Board index',
  },
};

/** HTML 转义。文案都是本仓库里的常量，仍一律转义 —— 规则不该有例外。 */
export function escHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * 生成一个语言版本的页头导航：左侧首页 + 标签，右侧语言切换。
 *
 * 两段是 `header-inner` 的直接子元素，靠它的 `space-between` 各就各位 ——
 * 这样"左一个右一个"由布局负责，不需要在 CSS 里给语言切换写 `margin-left: auto`
 * 这类补丁。
 *
 * @param {'zh'|'en'} lang 本页面语言
 * @param {string} prefix 本页到站点根的相对前缀：中文页 `''`，英文页 `'../'`
 * @param {string|null} boardId 本页是哪个榜单；首页传 null
 * @param {{tags?: boolean, tag?: string}} [opts]
 *   `tags` 为真表示本页是 tags 页（那它自己的链接要带 `aria-current`）；
 *   `tag` 是 tag 页当前的标签（语言切换要把它带上，否则换语言会丢掉筛选）。
 */
/**
 * 生成一个语言版本的页头导航：左侧首页，右侧语言切换。
 *
 * 两段是 `header-inner` 的直接子元素，靠它的 `space-between` 各就各位 ——
 * 这样"左一个右一个"由布局负责，不需要在 CSS 里给语言切换写 `margin-left: auto`
 * 这类补丁。
 *
 * @param {'zh'|'en'} lang 本页面语言
 * @param {string} prefix 本页到站点根的相对前缀：中文页 `''`，英文页 `'../'`
 * @param {string|null} boardId 保留形参：`build-site.mjs` 仍按文件推导它传入，
 *   但扁平站之后每个页面都是首页（`index.html` / `en/index.html`），
 *   语言切换一律走目录语义（`en/` 与 `../`）。
 */
export function renderNav(lang, prefix, boardId = null) {
  const text = NAV_TEXT[lang];

  // 语言切换指向**对方的首页**：扁平站只有两个页面（中英各一），
  // 原来"换语言留在同一个榜单上"的逐页对应已不存在（没有榜单页可对应了）。
  const other = lang === 'zh' ? 'en' : 'zh';
  const otherTag = other === 'en' ? 'en' : 'zh-CN';
  const otherHref = other === 'en' ? `${prefix}en/` : `${prefix}`;

  // 品牌名是 `<h1>` 而不是 `<a>`（2026-10-20 晚，owner 定稿）：
  // 扁平站每个页面**都是**首页 —— 指向自己的链接没有意义（点了原地不动），
  // 而且页头一个"趋势大盘"、内容区又一个，同一屏重复两次。现在品牌词只在
  // 页头出现**一次**，兼作页面唯一的 `<h1>`（大纲不变：h1 站点名 → h2 主题段
  // → h3 面板）；内容区不再另放标题，"跳回首页"这个动作随之消失。
  // （`prefix` 形参因此不再被 nav-home 使用 —— 语言切换还靠它拼 `en/` 前缀。）

  // 主题切换：一个按钮，放在语言切换**左边**（语言是"换一个地址"，主题是
  // "同一页换套配色"—— 前者更"出门"，所以靠外）。图标由 `assets/theme.js`
  // 在运行时按当前状态回填，这里先落一个**跟随系统**的图标与文案：
  // 无 JS 时看到的就是那个默认态，与实际配色（`:root` 暗色 + 系统偏好）一致。
  //
  // ★ 它是 `<button>` 而不是 `<a>`：点了不换地址，只是就地改配色。
  //   用 `<a href="#">` 会污染历史记录、也会让"当前页"的语义变模糊。
  //   状态（aria-label / title / 图标）由 `theme.js` 负责更新，
  //   这里只保证**无 JS 时也说得通**。
  const themeName = text.themeName;
  const themeBtn =
    `<button class="icon-btn theme-btn" type="button" id="theme-toggle" ` +
    `aria-label="${escHtml(themeName)}" title="${escHtml(themeName)}">` +
    `<span class="ic" data-icon="monitor"></span></button>`;

  return `<h1 class="nav-home">${escHtml(text.home)}</h1>
    <nav class="site-nav" aria-label="${escHtml(text.label)}">
      ${themeBtn}
      <a class="lang" href="${otherHref}" hreflang="${otherTag}" lang="${otherTag}"><span class="ic" data-icon="globe"><span class="sr-only">${escHtml(text.toggle)}</span></span>${escHtml(text.switchTo)}</a>
    </nav>`;
}

/** 把 `{{SITE_NAV}}` 落成真值。`lang`/`prefix` 由调用方按文件推导。 */
export function injectNav(html, lang, prefix, boardId, opts) {
  return String(html).split(NAV_PLACEHOLDER).join(renderNav(lang, prefix, boardId, opts));
}

/**
 * 面板与标签的真值 —— 住在 `assets/boards.js`（浏览器侧也要用，
 * 见该文件顶部说明为什么它必须在发布目录里）。这里只是隔着目录引它。
 * 不再 `export` 转出去：那会让这个构建期模块多一层对外表面，而调用方
 * （构建脚本、测试）都能直接引 `boards.js`。
 *
 * 标签的**显示文字**从 `assets/i18n.js` 取（`tagLabel`）—— 那份字典里没有任何
 * DOM 依赖，Node 下能直接 import（构建脚本本来就在 Node 里跑）。这与 `BOARD_TITLES`
 * 需要另抄一份不同：标签文字进了字典（因为它要按语言变），就不该再有第二份。
 */
import {
  BOARD_ORDER,
  BOARD_ICONS,
  TOPIC_SLUGS,
  boardsWithTag,
} from '../../web/public/assets/boards.js';
import { t, tagLabel } from '../../web/public/assets/i18n.js';

/* ================================================================== */
/* 首页索引条                                                          */
/* ================================================================== */

/**
 * 首页的分类栏 —— **构建期**生成，页面里写 `{{BOARD_INDEX}}`。
 *
 * 2026-10-20 按 owner 要求改成**左右分栏的左列**：宽屏下它是一条固定在左、
 * 自身滚动、**不折叠**的分类栏（不再是一条吸顶横条）；窄屏（<1024px）才退回
 * 页头下方那条可折叠的索引条（`trend.js` 注入的 `.idx-current` 按钮）。
 * 形态仍是**按主题分组**：六组，每组一个组名（`tag.<slug>`）加该主题下的榜。
 * 点一个榜就**只看那一个**（再点一次取消选中，落到每日视图）——
 *   · 分组让"找某一类"和"找某一个"在同一栏里都成立，比一串平铺的 39 片更容易扫；
 *   · 每个片带本榜的图标与来源色（`site.css` 的 `--src` 规则按 `[data-jump]` 染），
 *     与面板头是同一副面孔，扫一眼就能认出"那是微博"；
 *   · 分组本身是容器（边框 + 主题名），六组竖排下来层次比原来的六行更清楚。
 *
 * ## 为什么没有「全部」片
 * 再点一次选中的片就取消选中（落到每日视图），出口已经在原处，多一片只是占掉一格。
 *
 * ## 为什么主题/来源筛选从索引条上撤掉了
 * 索引条只留"选榜"这一件事。主题与来源仍是 `boards.js` 的 `BOARD_TAGS` 事实
 * （分类栏的分组就由它推出来），只是不再渲染成筛选控件。
 *
 * ## 为什么是 `<button>` 而不是 `<a href="#panel-…">`
 * 它不改变地址，只是切换右列显示哪一个榜（再点一次取消）——
 * 用 `<button>` 才说得通，也顺手保证了无障碍语义（`aria-pressed`）。
 *
 * ## 没有刷新按钮（2026-10-20 按 owner 要求移除）
 * 数据由定时任务每 2 小时刷新站内快照，页面上不需要再给一个"重新拉取"的入口。
 *
 * 面板骨架本身不在这里 —— 它由 `trend.js` 运行时按语言铺（数据、文案都要走
 * `i18n.js`），这里只落**导航**。`data-jump="<id>"` 就是两者的契约。
 */
export const INDEX_PLACEHOLDER = '{{BOARD_INDEX}}';

/**
 * 面板名 —— 取 `i18n.js` 的 `p.<id>.title`（**只有那一处来源**，不再另抄一份）。
 *
 * 这里曾经有一份 34×2 的手抄表（`BOARD_TITLES`），那是"构建期要、客户端也要"
 * 时的历史做法。既然构建脚本本来就在 Node 里跑、`i18n.js` 的 `t()` 没有任何 DOM
 * 依赖（见其顶部说明），直接引过来即可 —— 于是面板名在整个仓库里只剩一份，
 * 改一个名字不会漏掉索引条那一处。
 */
function boardTitle(lang, id) {
  return t(lang, `p.${id}.title`);
}

/**
 * 首页的粘性索引条正文 —— 按主题分组的 39 个榜（六行）。
 *
 * 顺序：主题按 `TOPIC_SLUGS`，组内按 `BOARD_ORDER`（与 `trend.js` 铺骨架的顺序
 * **同源**），所以索引条里的次序与页面上真正从上到下的次序一致。
 */
export function renderIndex(lang) {
  const text = NAV_TEXT[lang];

  // 组内成员从 `boards.js` 取（`boardsWithTag(topic)` 按 `BOARD_ORDER` 的顺序过滤），
  // 而不是从文案反推 —— 分组是 `BOARD_TAGS` 的事实，文案里没有这个字段。
  const rows = TOPIC_SLUGS.map((topic) => {
    const boards = boardsWithTag(topic);
    const chips = boards
      .map(
        (id) =>
          `<button class="idx-chip" type="button" data-jump="${escHtml(id)}" aria-pressed="false" title="${escHtml(boardTitle(lang, id))}">` +
          `<span class="idx-ic" data-icon="${escHtml(BOARD_ICONS[id] || 'box')}"></span>` +
          `<span class="idx-name">${escHtml(boardTitle(lang, id))}</span></button>`
      )
      .join('');
    // 组名旁一个**榜单数**（2026-10-20 晚）：扫左列时"哪类有多少榜"一眼可读。
    // ★ 计数是**推导**的（`boardsWithTag(topic).length`），不手写 —— 加榜后自己变。
    // 组名 span 的内容保持只有主题名（site.test.js 按它断言），数字放兄弟元素。
    const head =
      `<div class="idx-group-head"><span class="idx-group-label">${escHtml(tagLabel(topic, lang))}` +
      `</span><span class="idx-group-n">${boards.length}</span></div>`;
    // 组名同时是这一组的可访问名称（`role="group"`），读屏器会把"微博热搜"
    // 念成"中文热榜 组里的 微博热搜"。
    return `<div class="idx-group" role="group" aria-label="${escHtml(tagLabel(topic, lang))}">
      ${head}
      <div class="idx-group-items">${chips}</div>
    </div>`;
  }).join('\n    ');

  return `<nav class="board-index" id="board-index" aria-label="${escHtml(text.indexLabel)}">
    <div class="idx-groups">${rows}</div>
  </nav>`;
}

/** 把 `{{BOARD_INDEX}}` 落成真值（幂等：页面里没有占位符就原样返回） */
export function injectIndex(html, lang) {
  return String(html).split(INDEX_PLACEHOLDER).join(renderIndex(lang));
}

/**
 * 面板**主题分段**的静态骨架 —— 页面里写 `{{BOARD_TOPICS}}`。
 *
 * 六段（`TOPIC_SLUGS`），每段一个标题行（主题名取 `i18n.js` 的 `tag.<slug>`，
 * 与索引条的分组名同一份文案；右侧一个只刷新本段的「刷新」）与一个空的
 * `<div data-panels>`：`trend.js` 运行时把每个面板挂到**自己主题那一段**里
 * （`rootFor(id)`）。
 *
 * ## 为什么骨架在构建期落，而不是运行时由脚本建
 *   · 分段的**层次**（h1 站点名 → h2 主题 → h3 面板）是页面结构，不是数据：
 *     它该在没有脚本时也在（禁用 JS 时看到六个分节标题，而不是一片空白）；
 *   · 主题名与 `i18n.js` 只有一处来源 —— 若在 HTML 里手抄六份，改一个主题名
 *     要记得改五个地方（中英各一份、再加上索引条）。
 */
export const TOPICS_PLACEHOLDER = '{{BOARD_TOPICS}}';

export function renderTopics(lang) {
  return TOPIC_SLUGS.map(
    (slug) => `<section class="topic" id="topic-${escHtml(slug)}">
    <h2 class="topic-head">${escHtml(tagLabel(slug, lang))}</h2>
    <div class="topic-grid" data-panels></div>
  </section>`
  ).join('\n  ');
}

/** 把 `{{BOARD_TOPICS}}` 落成真值 */
export function injectTopics(html, lang) {
  return String(html).split(TOPICS_PLACEHOLDER).join(renderTopics(lang));
}
