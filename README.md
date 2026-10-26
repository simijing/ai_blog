# PZX 的博客

一个用原生 Web 技术写成的纯静态个人博客：文章是 Markdown 文件，站点信息与文章列表集中在 `js/config.js` 里配置，浏览器加载后由 JavaScript 完成 Markdown 渲染、hash 路由和页面拼装。

不需要构建、不需要后端、不依赖 Node 运行时环境（`tools/serve.mjs` 仅用于本地预览），把仓库推到 GitHub Pages 或腾讯云 EdgeOne Makers（原 EdgeOne Pages）就能上线。

## 技术栈

- **HTML / CSS / JavaScript**：无框架、无打包器、无编译步骤，源码即产物。
- **Markdown**：文章正文为 `.md` 文件，存放在 `content/` 下，由 `js/markdown.js` 在浏览器端解析为 HTML。
- **JS 配置**：站点信息与文章元数据统一写在 `js/config.js` 的 `SITE_CONFIG` 中，改配置不需要动页面代码。
- **Hash 路由**：页面切换使用 `#` 后的路径（如 `/#/post/hello-world`），服务器只需要提供静态文件，部署在子路径下也无需额外重写规则。

## 目录结构

```text
pzx的博客/
├── index.html                     # 站点唯一入口，挂载应用
├── 404.html                       # 简单 404 兜底页，引导返回首页
├── robots.txt                     # 搜索引擎抓取说明
├── .nojekyll                      # 关闭 GitHub Pages 的 Jekyll 处理
├── .gitignore                     # 忽略本地验证产物与临时文件
├── README.md                      # 本文档
├── css/
│   ├── style.css                  # 全站基础样式与布局
│   ├── article.css                # 文章正文排版样式
│   └── responsive.css             # 响应式断点与移动端适配
├── js/
│   ├── config.js                  # 站点配置 SITE_CONFIG 与文章元数据
│   ├── markdown.js                # Markdown 解析器
│   ├── renderer.js                # 页面与文章列表渲染
│   ├── router.js                  # hash 路由
│   └── app.js                     # 应用入口与事件绑定
├── content/
│   ├── about.md                   # 「关于」页正文
│   └── posts/                     # 文章目录，一个 .md 对应一篇文章
│       ├── hello-world.md
│       ├── markdown-driven-blog.md
│       ├── ai-coding-workflow.md
│       ├── css-design-tokens.md
│       ├── edgeone-pages-deploy.md
│       └── reading-notes.md
├── tools/
│   ├── serve.mjs                  # Node 本地静态服务器（仅开发使用）
│   └── check-markdown.mjs         # 内容自检脚本（可选，本地开发使用）
└── .github/
    └── workflows/
        └── deploy-pages.yml       # 推送 main 分支自动部署到 GitHub Pages
```

`content/posts/` 下的这 6 个 Markdown 文件即当前全部文章，文件名（去掉 `.md`）对应 `js/config.js` 中的 `slug`；新增文章时按同样方式放入该目录，并同步登记元数据。

## 本地预览

因为浏览器在 `file://` 协议下会拦截 `fetch` 读取 Markdown，**不能直接双击 `index.html`**，需要用本地 HTTP 服务打开。任选一种：

**方式一：Python（系统自带模块，无需安装依赖）**

```bash
python -m http.server 8000
```

然后在浏览器访问 <http://localhost:8000/>。

**方式二：Node.js（项目自带的小型静态服务器）**

```bash
node tools/serve.mjs
```

按终端输出的地址访问（端口以脚本输出为准，通常为 <http://localhost:8000/>）。该脚本只提供静态文件服务，不参与线上部署。

修改 `css/`、`js/`、`content/` 下的文件后，刷新浏览器即可看到效果，不需要重新构建。

## 新增文章

1. **新建 Markdown 文件**：在 `content/posts/` 下创建 `<slug>.md`，写入文章正文。文件名去掉 `.md` 后缀就是 `slug`，建议使用英文小写字母加连字符，例如 `my-first-post.md`。
2. **登记文章元数据**：打开 `js/config.js`，在 `SITE_CONFIG.posts` 数组末尾追加一个对象：

   ```js
   {
     slug: "my-first-post",
     title: "我的第一篇文章",
     date: "2026-01-01",
     category: "随笔",
     tags: ["生活", "记录"],
     excerpt: "列表页展示的一句话摘要。",
     published: true
   }
   ```

3. **本地预览确认**：启动本地服务，检查列表、排序、分类/标签与正文渲染是否正常。
4. **发布**：`git add .`、`git commit -m "post: 我的第一篇文章"`、`git push`，推送后会自动部署。

新增或修改文章后，可以运行内容自检脚本（可选，需要 Node.js）：

```bash
node tools/check-markdown.mjs
```

它会核对 `js/config.js` 的 slug 与 `content/posts/` 下的文件名是否一一对应、日期格式是否合法、正文是否误写了 H1，并逐篇渲染 Markdown，确认标题、列表与代码块数量正常。

文章元数据字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `slug` | 是 | 文章的 URL 标识，必须与 `content/posts/` 下的文件名（不含 `.md`）完全一致，含大小写与连字符 |
| `title` | 是 | 文章标题，显示在列表与文章页 |
| `date` | 是 | 发布日期，格式为 `YYYY-MM-DD`，用于列表排序 |
| `category` | 是 | 分类名称，建议一篇只属于一个分类 |
| `tags` | 否 | 标签数组，可用于筛选，保持与已有标签写法一致 |
| `excerpt` | 否 | 摘要，显示在文章列表卡片上 |
| `published` | 否 | 缺省为 `true`；设为 `false` 视为草稿，不会出现在站点中 |

> 没有在 `SITE_CONFIG.posts` 中登记的文章不会出现在站内；只登记了元数据、但缺少同名 Markdown 文件时，打开文章会读取失败。两者要成对新增。

## 站点配置

打开 `js/config.js`，站点信息都在 `SITE_CONFIG` 对象里，改完保存刷新页面即可生效，无需构建：

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名称，用于页头、浏览器标题 |
| `brand` | 首页 Hero 徽标里的短名称 |
| `tagline` | 一句话副标题，显示在站点名称下方 |
| `heroTitle` / `heroGradient` | 首页大标题文案，以及标题中做渐变强调的片段（需是 `heroTitle` 的子串） |
| `description` | 站点描述，用于列表页说明与页面 meta 信息 |
| `author` | 作者名，用于页脚与关于页 |
| `role` | 作者身份标签，显示在侧栏与关于页 |
| `bio` | 作者简介，显示在关于页/侧栏 |
| `avatarText` | 头像圆环里显示的字母（默认是作者名） |
| `socials` | 社交链接列表，默认为空数组；按文件中注释的 `{ name, url }` 结构添加后会显示在侧栏与关于页 |
| `siteTech` | 关于页侧栏展示的技术栈列表（`{ name, note }`） |
| `posts` | 文章元数据数组，字段见上一节 |

改站点名称、作者署名、社交链接、站点描述，都只改这个文件，不需要动 HTML。

## 部署到 GitHub Pages

仓库已内置 `.github/workflows/deploy-pages.yml`，推送到 `main` 分支即自动部署。

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "chore: init blog"
git branch -M main
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

### 2. 在仓库中开启 Pages

进入仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。

这一步只需设置一次。选择后 GitHub 不再要求指定分支目录，而是由工作流上传的产物直接发布。

### 3. 等待部署完成

- 推送 `main` 后自动触发工作流；
- 也可以到 **Actions → Deploy to GitHub Pages → Run workflow** 手动触发（`workflow_dispatch`）；
- 在 **Actions** 运行记录或 **Settings → Pages** 顶部可以看到部署结果与站点地址。

> 首次推送时，如果还没在 Settings → Pages 里把 Source 设为 GitHub Actions，工作流会失败一次。先完成第 2 步，再在 Actions 页面手动 **Run workflow** 一次即可；之后每次 push 都会自动部署。

### 4. 访问站点

- 项目页（仓库名不是 `<用户名>.github.io`）：`https://<用户名>.github.io/<仓库名>/`
- 用户/组织页（仓库名恰好是 `<用户名>.github.io`）：`https://<用户名>.github.io/`

由于使用 hash 路由，部署在 `/仓库名/` 子路径下也能正常工作，无需修改任何路径配置。

### 工作流要点

| 配置 | 作用 |
| --- | --- |
| `on: push: branches: [main]` | 推送 `main` 触发部署 |
| `on: workflow_dispatch` | 支持在 Actions 页面手动重新部署 |
| `permissions: contents: read` | 只读检出仓库内容 |
| `permissions: pages: write` | 允许工作流发布 GitHub Pages |
| `permissions: id-token: write` | 供 Pages 部署使用的 OIDC 令牌 |
| `concurrency: group: pages` | 同一时间只允许一个 Pages 部署任务，避免并发覆盖 |
| `actions/configure-pages@v5` | 读取仓库的 Pages 配置 |
| `actions/upload-pages-artifact@v3`（`path: .`） | 将仓库根目录打包为静态产物 |
| `actions/deploy-pages@v5` | 把产物发布到 Pages 并输出站点地址 |

仓库根目录的 `.nojekyll` 是一个空文件，用于关闭 GitHub Pages 默认的 Jekyll 处理，避免 `_` 开头的文件被忽略、避免 Markdown 被当作模板渲染，确保 `content/` 下的 `.md` 和 `js/`、`css/` 原样发布。

## 部署到腾讯云 EdgeOne Makers（原 EdgeOne Pages）

EdgeOne Pages 现已升级为 **EdgeOne Makers**（产品入口、文档域名与行为保持不变），它支持静态站点托管，导入 Git 仓库即可，部署配置与「无构建」项目匹配。

### 通过 Git 仓库导入（推荐）

1. 登录 EdgeOne Makers 控制台（原 EdgeOne Pages），点击 **创建项目 → 导入 Git 仓库**；
2. 授权并选择本博客的 GitHub 仓库，分支选 `main`；
3. 构建配置按下面填写：
   - **框架预设**：选择 **Other**（或「其它」/「静态站点」）；
   - **构建命令**：**留空**，项目没有构建步骤；
   - **输出目录**：填 `/`（即仓库根目录，静态文件直接位于根目录下）；
   - 环境变量、Node 版本等无需额外设置。
4. 保存并部署，完成后会得到一个 `*.edgeone.app` 默认域名。

之后每次 `git push` 到 `main`，EdgeOne Makers 会自动同步文件并重新部署。

### 直接上传压缩包

不想接 Git 时也可手动上传：把仓库根目录打包成 zip（可以保留 `.github/`、`.nojekyll`，不影响 EdgeOne Makers；请勿包含 `.git/` 目录），在控制台创建项目时选择直接上传压缩包即可。这种方式下每次更新都要重新打包上传，适合一次性发布。

## 绑定自定义域名

- **GitHub Pages**：先在域名服务商处添加解析——子域名用 CNAME 指向 `<用户名>.github.io`，根域名用 A 记录指向 GitHub Pages 的地址（具体记录值以 GitHub 官方文档为准）；然后到仓库 **Settings → Pages → Custom domain** 填入域名并保存，勾选 **Enforce HTTPS**，等待证书签发。
- **EdgeOne Makers（原 EdgeOne Pages）**：在项目设置中找到域名管理，添加自定义域名并按提示配置 CNAME，等待证书部署完成。

两种方式都无需修改仓库代码。使用自定义域名后，站点根地址变为 `https://你的域名/`，hash 路由照常工作。

## 常见问题

### 刷新页面出现 404

本项目使用 **hash 路由**，地址形如 `https://<用户名>.github.io/<仓库名>/#/post/hello-world`。`#` 之后的内容不会发送给服务器，所以刷新、收藏、分享链接都不会触发服务器 404。

如果确实遇到 404，按顺序检查：

1. 访问的是 Pages / EdgeOne 给出的**站点根地址**，且末尾带 `/`；
2. 站内链接没有手写成不带 `#` 的路径（例如 `/post/hello-world`），否则会请求不存在的文件；
3. 部署已完成：GitHub 看 Actions 最近一次运行是否成功，EdgeOne Makers 看部署记录状态；
4. 仓库根目录的 `404.html` 是兜底页面，出现 404 时会引导返回首页。

### 新增的文章不显示

按下表逐项检查：

1. **`published` 是否被设为 `false`**：`false` 表示草稿，不会出现在列表和路由中；
2. **`slug` 与文件名是否一致**：`content/posts/my-first-post.md` 对应 `slug: "my-first-post"`，大小写、连字符都要一致，且不要带 `.md`；
3. **元数据是否已登记**：只加了 Markdown 文件、没在 `js/config.js` 的 `posts` 中登记，文章不会展示；
4. **`date` 格式是否为 `YYYY-MM-DD`**，格式错误可能导致排序异常、位置靠后；
5. 保存后强制刷新浏览器（见下一条），并确认部署已完成。

### 修改后页面没有变化（缓存）

- 浏览器缓存：按 `Ctrl + F5`（macOS 为 `Cmd + Shift + R`）强制刷新；或打开开发者工具，在 Network 面板勾选 **Disable cache** 后刷新；
- GitHub Pages 有 CDN 缓存，部署完成后通常几分钟内生效，可稍等再刷新；
- EdgeOne Makers 可在控制台执行缓存刷新，再访问站点；
- 手机浏览器可清除站点数据或换用无痕模式重试。

### GitHub Actions 部署失败

- 确认 **Settings → Pages → Build and deployment → Source** 已选择 **GitHub Actions**；
- 确认 **Settings → Actions → General** 中允许 Actions 运行；
- 打开 **Actions** 中失败的那次运行，展开具体步骤查看错误日志。

## 版权

文章内容归作者所有；站点代码可自由修改用于搭建自己的博客。
#   a i _ b l o g  
 #   a i _ b l o g  
 