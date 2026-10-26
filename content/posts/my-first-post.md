

## 1. 新建 Markdown 文件
在 content/posts/ 下新建 my-first-post.md。文件名去掉 .md 就是文章的 slug，建议用小写英文和连字符。

正文规则：

- 不要写一级标题 #，文章标题由 js/config.js 提供；
- 正文从 ## 二级标题开始；
- 支持标题、列表、引用、表格、代码块、行内代码、链接、图片、加粗/斜体等常见语法。


## 2. 在 `js/config.js` 里登记元数据


打开 [js/config.js](js/config.js)，在 `SITE_CONFIG.posts` 数组里追加一条：

```js
	{
	  slug: 'my-first-post',
	  title: '我的第一篇文章',
	  date: '2026-11-01',
	  category: '随笔',
	  tags: ['记录', '开始'],
	  excerpt: 'content/posts下Markdown文件写博客内容，js/config.js写格式。',
	  published: true
	}
```

字段要点：
slug 必须与文件名完全一致（不含 .md，区分大小写）；
date 用 YYYY-MM-DD，列表按日期倒序排列；
excerpt 是首页卡片摘要，建议填写；
published: false 表示草稿，不会出现在站点中；
只登记元数据、没有对应 md 文件，打开文章会加载失败；只放 md 文件、不登记元数据，文章不会出现。


## 3. 本地预览 + 自检

powershell


cd "D:\.\pzx的博客"

node tools/serve.mjs

打开 http://127.0.0.1:8000/ 检查列表、排序和正文；再运行一次内容自检：

powershell


node tools/check-markdown.mjs
它会检查 slug 与文件名是否对应、日期格式、是否误写 H1、列表/代码块渲染数量等。

## 4. 提交并推送
powershell

git add content/posts/my-first-post.md js/config.js

git commit -m "post: 我的第一篇文章"

git push origin main

推送后：

GitHub Pages：到仓库 Actions 看 Deploy to GitHub Pages 是否成功；
EdgeOne Makers：到控制台看部署记录，成功后即生效。
部署完成后，文章地址形如：


https://<用户名>.github.io/<仓库名>/#/post/my-first-post