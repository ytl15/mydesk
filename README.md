# 小书桌

一张摊开的桌子，上面铺满工作中的稿纸；做完的，站到尽头的书架上去。

Hugo 静态站。首页由 `data/` 下的两个 YAML 驱动，**不需要写模板就能改内容**。

---

## 本地预览

```bash
hugo server
```

打开 <http://localhost:1313/>。改 `data/` 里的文件会自动刷新。

没装 Hugo 的话：`brew install hugo`。

---

## 改内容的两条路

### 路一：在页面上改（推荐，改位置用）

1. 页面左上点 **✎ 编辑**
2. 拖稿纸到书架＝成书，拖到抽屉＝归档；书脊**右键**（或编辑模式下左键点）弹菜单，可改实体／虚体、换位置
3. 便签可以增、删
4. 点 **导出 YAML** → 点 **下载 works.yaml** 和 **下载 notes.yaml**
5. 把两个文件覆盖到 `data/` 下
6. `git diff data/` 看一眼改了什么，确认无误再提交

### 路二：直接改 `data/*.yaml`（写新简介、加新书用）

用编辑器改 `data/works.yaml`。加一部新译作，复制一整条记录改就行。

> **别两头同时改。** 导出是整个文件覆盖，不是合并。手改过文件之后，**先刷新页面**再用编辑模式，否则一点导出就把手改的内容盖回去。

---

## `data/works.yaml` 字段

| 字段 | 说明 |
|---|---|
| `id` | 唯一标识，英文小写，别重复 |
| `place` | `shelf` 书架 ／ `drawer` 归档抽屉 ／ `desk` 台面 |
| `solid` | `true` 显示成实体书脊；`false` 在书架上留一格虚线空位 |
| `recension` | 写 `true` 表示这是精校而非从零翻译，卡片会带赭色左边线 |
| `title` `sub` `stage` | 标题、副题、时间与状态 |
| `spine` | 书脊：`label` 短名（≤9 字）、`w` 宽、`h` 高（rem）、`color` 底色 |
| `cells` | 进度格，一个字符一格：`f` 译毕、`h` 节译或残稿、`e` 未译。**按序号排列**，不是把实心堆前面。数目不明就写 `~`，不画格子 |
| `cite` | 书目 |
| `key` | 进度说明，可用 `<b>` |
| `blurb` | 简介 |
| `next` | 下一步要做什么 |
| `links` | 每条 `label` / `href`，加 `primary: true` 是主按钮 |

台面上的作品会自动在书架上显示成一格点线空位——那是它将来要站的地方。

---

## 部署

推到 `main` 分支，GitHub Actions 自动构建并发布到 GitHub Pages。工作流在 `.github/workflows/hugo.yml`。

### 搜索引擎收录开关

现在是**整站拦爬虫**的状态：`hugo.toml` 里 `[params.privacy] noindex = true`，会输出 `Disallow: /` 的 robots.txt，并在首页加 noindex 标签。

想让搜索引擎收录时，把 `hugo.toml` 里这三行删掉：

```toml
[params.privacy]
  noindex = true
```

> 收录是**不可逆**的：一旦被抓走、被存档，就收不回来了。想清楚再删。

---

## 目录

```
data/works.yaml        作品与位置        ← 主要改这里
data/notes.yaml        便签
hugo.toml              站名、标语、桌角工具链接
layouts/index.html     首页模板
layouts/partials/      书脊
assets/css/main.css    全部样式
assets/js/desk.js      拖拽、菜单、浮窗、导出
static/translation/    译文正文（从小森林搬过来的）
```

译文正文是独立的 HTML，放在 `static/translation/` 下，Hugo 原样输出，不经过模板。
