/* ============================================================================
   LMZ · notebooks —— 站点数据
   这是全站唯一需要你手动维护的文件。

   ⚠ 最容易出错的地方：每条记录内部的字段之间必须有逗号，最后一条记录后面也要有逗号。
     少一个逗号，整个文件就不是合法的 JS，首页会一行笔记都不显示（页面底部会提示）。
     改完保存后刷新页面，浏览器可能缓存旧版本，按 Ctrl+F5 强制刷新。

   每条的字段：
     title    笔记标题（中文为主，专业术语保留英文）
     date     "YYYY-MM-DD"，用你写这篇笔记的日期，索引按它分组排序
     topic    方向，对应下面 TOPICS 里的颜色
     tags     数组，两三个关键词就够
     summary  一句话说明这篇在做什么，会显示在标题下面（可以留空）
     file     "notes/xxx.html"，笔记页面。留空的话索引里会显示「待补」
     ipynb    可选，"notebooks/xxx.ipynb"，留空则不显示下载链接
     cells    可选，这篇 notebook 有多少个 cell，按 22 这样写数字
     source   可选，源文件名字，比如 "numpy.ipynb"
   ========================================================================= */

const SITE = {
  name:    "LMZ",
  name_en: "notebooks",
  email:   "qflmz2007@163.com",
  github:  "",                         // ← 填上你的 GitHub 主页，顶部那个链接才会出现
  scholar: "",                         // ← 可选，Google Scholar / ORCID，留空则不显示
  foot:    "纯静态页面，无框架无构建。"
};

/* 每个方向领一个颜色，颜色变量写在 assets/style.css 里（--t-a/--t-t/--t-c/--t-g）。
   加新方向就照着写一行，比如 "pandas": "--t-c"。没在这里写的方向会用灰色，不影响显示。 */
const TOPICS = {
  "numpy": "--t-a"
  // "pandas": "--t-t",
  // "可视化": "--t-c",
  // "基础语法": "--t-g"
};

const NOTES = [
  {
    title:   "numpy",
    date:    "2026-09-27",
    topic:   "numpy",
    tags:    ["numpy"],
    summary: "",
    file:    "notes/numpy.html",
    ipynb:   "notebooks/numpy.ipynb",
    cells:   22,
    source:  "numpy.ipynb"
  }
];
