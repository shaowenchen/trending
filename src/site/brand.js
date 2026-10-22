/**
 * 站点品牌名（工程侧）与**占位符门禁**。
 *
 * ## 品牌词的现状（2026-10-20 晚）
 * 页面上出现品牌词的地方——页头左上角（`src/site/nav.js` 的 `NAV_TEXT.home`）、
 * 内容 `<h1>`、`<title>`——现在都是**骨架文案**，按语言各写各的
 * （「趋势大盘」/ "Trend boards"）：标题是一整句带描述的文案，
 * 一个占位符产不出两种语言的两个词，`{{BRAND}}` 注入机制因此退役。
 *
 * `BRAND` 常量降级为**工程侧的英文短名**：只剩构建日志那一行在用
 * （`构建完成 · Trend · 16 个文件`）。改它不影响页面上的任何文字。
 *
 * ## 占位符门禁（仍然活着）
 * 页面里还有**真占位符**：`{{GTM}}` / `{{GTM_NOSCRIPT}}` / `{{THEME_BOOT}}` /
 * `{{SITE_NAV}}` / `{{BOARD_INDEX}}` / `{{BOARD_TOPICS}}`，由构建步骤
 * `scripts/build-site.mjs` 落成真值。`findUnresolvedPlaceholders` 是它们的
 * 门禁：发布出去的 HTML 里若还残留 `{{XXX}}`，就是构建漏了一步 ——
 * 访客会直接看到那串字面量。
 *
 * 为什么限定"大写字母/数字/下划线"：`web/public/assets/*.js` 里有大量
 * JSDoc 类型注释形如 `{{ok:boolean}}`，它们会**合法地**进入页面。
 * 把任何 `{{` 都判成缺陷会天天误报，而误报会训练人忽略门禁。
 */
export const BRAND = 'Trend';

const PLACEHOLDER_RE = /\{\{[A-Z][A-Z0-9_]*\}\}/g;

export function findUnresolvedPlaceholders(text) {
  return [...String(text).matchAll(PLACEHOLDER_RE)].map((m) => m[0]);
}
