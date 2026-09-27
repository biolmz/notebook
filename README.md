# 笔记站

一个纯静态的 Jupyter 笔记站：首页是笔记索引（按方向筛选、可搜索），点进去是笔记正文。
没有框架、没有构建步骤、不请求任何外部字体或 CDN 资源——所有东西都在这个文件夹里。

## 目录

```
index.html            首页，笔记索引
notes.js              ★ 站点数据：站点信息、方向配色、笔记清单（就这一个文件要手动维护）
assets/
  style.css           全站样式（浅色 + 深色两套变量都在这里）
  app.js              主题切换、索引渲染、筛选搜索
notes/
  *.html              每篇笔记的页面
  示例文件/           建站时的示例笔记存档（scanpy / BLAST / 混合模型 / PyTorch）＋ 手写模板
notebooks/            源 .ipynb（给"下载源 notebook"链接用）
```

> ⚠ `notes.js` 里**每一行的结尾都要有逗号**，包括最后一条记录。少一个，
> 整个文件就不是合法的 JS，首页会一行都不显示（这时页面会给出提示）。
> 记住改完按 Ctrl+F5 强制刷新，否则浏览器可能给你看缓存。


## 本地预览

在**笔记站**文件夹里（不是随便哪个目录）运行：

```bash
python -m http.server 8000
```

然后浏览器打开 <http://localhost:8000/>。直接双击 `index.html` 也能看，
只是少数浏览器在 `file://` 下会限制部分功能。

## 加一篇笔记

### 方式一：从 Jupyter 导出后导入（推荐）

```bash
jupyter nbconvert --to html --template lab 你的notebook.ipynb
```

把导出的 HTML 放进站点文件夹，然后让 Claude 导入。导入会做三件事：套上站点的页头和页脚、
按需要输出到 `notes/`、往 `notes.js` 里追加一条索引记录（顺带去掉导出里用不上的 require.js 和 MathJax，
所以导出的文件不用自己改）。

> ⚠ 别把 nbconvert 导出的 HTML 直接丢进 `notes/` 就当完事：它自己是白底、没有站点顶栏和深色按钮、
> 浏览器标题还是 Untitled，而且要联网加载 cdnjs 上的脚本。必须套一次外壳。
>
> 做这件事的脚本 `add_note.py` 目前不在站点文件夹里（保持文件夹干净），需要时可以让 Claude 放回来。

### 方式二：手写

复制 `notes/示例文件/_template.html`，照着里面的注释改（放进 `notes/` 之后要把路径里的
`../../` 改回 `../`），然后到 `notes.js` 的 `NOTES` 数组里加一条（`file` 指向你新建的
那个文件）。模板里已经示范了代码单元格、输出、表格、图、引用块怎么写。
Markdown 写的笔记也可以先转成 HTML 再按方式一导入。

## 每条笔记的字段

打开 `notes.js`，`NOTES` 数组里每条就是这样一段：

```js
{
  title:   "标题",
  date:    "2026-09-12",          // 索引按这个排序、分组
  topic:   "numpy",               // 对应 TOPICS 里的颜色；没写的方向用灰色
  tags:    ["numpy"],             // 两个三个就够，多了索引会乱
  summary: "一句话说明。",
  file:    "notes/xxx.html",      // 留空的话索引里显示「待补」
  ipynb:   "notebooks/xxx.ipynb", // 可选
  cells:   22,                    // 可选，notebook 的 cell 数
  source:  "xxx.ipynb"            // 可选
}
```

排序、年份分组、篇数统计、方向计数都是脚本按数据算的，不用手改。

## 改站点信息

| 想改什么 | 改哪里 |
| --- | --- |
| 名字、邮箱、GitHub、Scholar | 根目录 `notes.js` 顶部的 `SITE` |
| 方向和它的颜色 | `notes.js` 的 `TOPICS`（颜色变量在 `assets/style.css` 的 `--t-a/--t-c/--t-g/--t-t`） |
| 首屏那句话、关于我 | `index.html` 里标了 `<!-- 改这里 -->` 的地方 |
| 配色、字体、栏宽 | `assets/style.css` 顶部的 `:root`，深色版本在同文件的 `[data-theme="dark"]` |
| 站点图标 | 三个页面 `<link rel="icon">` 里的那段 SVG，色值改 `%23XXXXXX` 那几处 |

## 深色模式

默认浅色。右上角按钮切换，选择存在浏览器本地，下次打开还是上次的模式。
笔记页里嵌的 notebook 会跟着一起变——`style.css` 里有一段把 JupyterLab 的
配色变量映射到了本站在用的变量上，所以不用为深色单独导出一份。

## 部署到 GitHub Pages

```bash
cd 笔记站
git init
git add .
git commit -m "notes site"
git branch -M main
git remote add origin git@github.com:你的用户名/仓库名.git
git push -u origin main
```

然后在 GitHub 仓库的 Settings → Pages 里，Source 选 `Deploy from a branch`，
分支选 `main`、目录选 `/ (root)`，保存。一两分钟后访问
`https://你的用户名.github.io/仓库名/`。

如果想让首页地址不带仓库名（`https://你的用户名.github.io/`），
仓库名要取成 `你的用户名.github.io`。

## 几件小事

- 建站时的那几篇示例笔记（scanpy / BLAST / 混合模型 / PyTorch）和手写模板都放在
  `notes/示例文件/` 里存档，跟索引没有关系，可以整个删掉。
- 删笔记时记得两处都删：`notes/` 里的页面文件 + `notes.js` 里的那条记录。
- 图片放在 `notes/` 里用相对路径引用就好；Jupyter 导出里的图是 base64 内嵌的，
  页面里图片大的话整体会比较大（一篇五张图的笔记可能到 1 MB），这是正常的。
  真正占体积的其实是 nbconvert 内联进去的 JupyterLab 样式表——一篇普通笔记大概 260 KB
  都是它，属于可接受范围，不用管。
- 页面上显示的时间一律取 `date` 字段，和文件修改时间无关。
- 改完 `notes.js` 记得强制刷新（Ctrl+F5），浏览器可能缓存了旧版本。
