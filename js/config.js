/* ==========================================================================
   站点配置 —— 内容管理中「JavaScript 配置」部分
   --------------------------------------------------------------------------
   改这里就能改站点信息与文章目录，不需要动任何页面代码。
   新增一篇文章：
     1. 在 content/posts/ 下新建 <slug>.md，写正文（不要写 H1，标题由下面的
        title 字段提供；正文从 ## 二级标题开始即可）。
     2. 在下面的 posts 数组里追加一条元数据，slug 必须与文件名一致。
     3. 把 published 设为 true，刷新页面就能看到。
   ========================================================================== */

var SITE_CONFIG = {
  /* ---------- 站点基本信息 ---------- */
  title: 'PZX 的博客',
  brand: 'pzx',
  tagline: '记录技术、思考与生活',
  heroTitle: '记录技术，也记录思考',
  heroGradient: '也记录思考',
  description: 'pzx 的个人博客：记录前端开发、AI 工具与日常思考，把值得留下的东西写下来。',
  author: 'pzx',
  role: '独立开发者 / 长期主义者',
  bio: '喜欢把复杂问题拆成可以动手验证的小步骤。白天写代码，晚上读点书，偶尔在这里留下一些文字。',
  avatarText: 'pzx',

  /* 社交链接：name 显示文字，url 目标地址；留空数组 [ ] 则不显示。
  socials: [
    { name: 'GitHub', url: 'https://github.com/yourname' },
    { name: '邮箱', url: 'mailto:hello@example.com' }
  ],
  */
  socials: [],

  /* 关于页侧栏展示的技术栈说明（纯展示） */
  siteTech: [
    { name: 'HTML5 + CSS3', note: '语义化结构与响应式布局' },
    { name: '原生 JavaScript', note: '零依赖的解析与路由' },
    { name: 'Markdown', note: '内容以纯文本文件管理' },
    { name: '静态托管', note: 'GitHub Pages / EdgeOne Makers' }
  ],

  /* ---------- 文章目录 ---------- */
  /* 字段说明：
       slug     文章唯一标识，也是 content/posts/<slug>.md 的文件名
       title    文章标题（页面 H1 由它生成）
       date     发布日期，YYYY-MM-DD，用于排序与展示
       category 分类，单个字符串
       tags     标签数组，可为空
       excerpt  摘要，用于列表页卡片，建议填写
       published 是否公开，false 时不会出现在列表里
  */
  posts: [
    {
      slug: 'hello-world',
      title: '你好，世界：这个博客的第一篇文章',
      date: '2026-10-20',
      category: '随笔',
      tags: ['博客', '开始'],
      excerpt: '为什么在一切都追求即时反馈的时代，还要认真地搭一个博客？以及我打算在这里记录些什么。',
      published: true
    },
    {
      slug: 'markdown-driven-blog',
      title: '用 Markdown 管理内容：一个零依赖博客的实现思路',
      date: '2026-10-22',
      category: '前端',
      tags: ['Markdown', 'JavaScript', '前端'],
      excerpt: '不引入构建工具、不装第三方库，如何在浏览器里把 Markdown 文件变成可读的文章？聊聊这个博客的实现取舍。',
      published: true
    },
    {
      slug: 'ai-coding-workflow',
      title: 'AI 辅助编程的日常工作流',
      date: '2026-10-23',
      category: 'AI',
      tags: ['AI', '效率', '工作流'],
      excerpt: '把 AI 当成结对伙伴，而不是代码生成器：我的提问方式、验证习惯与复盘方法。',
      published: true
    },
    {
      slug: 'css-design-tokens',
      title: '用 CSS 变量搭建可维护的设计系统',
      date: '2026-10-24',
      category: '前端',
      tags: ['CSS', '设计系统'],
      excerpt: '从颜色、间距到字体层级，用一套变量把样式收拢起来。改版的时候，不再全局搜索替换。',
      published: true
    },
    {
      slug: 'edgeone-pages-deploy',
      title: '把静态博客部署到 EdgeOne Pages 与 GitHub Pages',
      date: '2026-10-25',
      category: '部署',
      tags: ['部署', 'EdgeOne', 'GitHub Pages'],
      excerpt: '两条静态托管路线的实际配置与体验差异：GitHub Actions 和 EdgeOne Pages 分别要注意什么。',
      published: true
    },
    {
      slug: 'reading-notes',
      title: '最近读的几本书与技术笔记',
      date: '2026-10-26',
      category: '随笔',
      tags: ['阅读', '笔记'],
      excerpt: '读书笔记与零散的技术思考：保持输入，也保持输出。',
      published: true
    },
	{
	  slug: "my-first-post",
	  title: "静态博客修改发布方法",
	  date: "2026-10-26",
	  category: "随笔",
	  tags: ["生活", "记录"],
	  excerpt: "content/posts下Markdown文件写博客内容，js/config.js写格式。",
	  published: true
	}
  ]
};
