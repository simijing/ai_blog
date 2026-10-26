/* ==========================================================================
   renderer.js —— 页面模板渲染
   --------------------------------------------------------------------------
   只负责「数据 → HTML 字符串」，不碰 DOM 事件、不发起请求；路由与交互在
   router.js / app.js。所有插值统一转义，避免内容里的特殊字符破坏结构。
   ========================================================================== */
(function (global) {
  'use strict';

  var config = global.SITE_CONFIG || { posts: [] };

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="8" cy="8" r="1.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>'
  };

  var esc = (global.Markdown && global.Markdown.escapeHtml) || function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  };

  function icon(name, extraClass) {
    var body = ICONS[name] || ICONS.file;
    return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  function iconForSocial(name) {
    var value = String(name || '').toLowerCase();
    if (value.indexOf('github') !== -1 || value.indexOf('git') !== -1) return 'github';
    if (value.indexOf('mail') !== -1 || value.indexOf('邮') !== -1) return 'mail';
    if (value.indexOf('链接') !== -1) return 'link';
    return 'globe';
  }

  function getPublishedPosts() {
    var posts = Array.isArray(config.posts) ? config.posts.slice() : [];
    return posts
      .filter(function (post) {
        return post && post.published !== false && post.slug;
      })
      .sort(function (a, b) {
        return String(b.date || '').localeCompare(String(a.date || ''));
      });
  }

  function getPostBySlug(slug) {
    var posts = getPublishedPosts();
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].slug === slug) return posts[i];
    }
    return null;
  }

  function countBy(posts, key) {
    var map = {};
    posts.forEach(function (post) {
      var values = key === 'tags' ? (post.tags || []) : [post.category];
      values.forEach(function (value) {
        if (!value) return;
        map[value] = (map[value] || 0) + 1;
      });
    });
    return Object.keys(map).map(function (name) {
      return { name: name, count: map[name] };
    }).sort(function (a, b) {
      return b.count - a.count || a.name.localeCompare(b.name);
    });
  }

  function formatDate(date) {
    return String(date || '').slice(0, 10);
  }

  function readingTime(markdown) {
    var text = String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/[#>*_~\-\[\]()!|]/g, ' ');
    var cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    var latin = (text.match(/[A-Za-z0-9_]+/g) || []).length;
    return Math.max(1, Math.round((cjk + latin * 0.6) / 350));
  }

  function postUrl(post) {
    return '#/post/' + encodeURIComponent(post.slug);
  }

  function tagButtons(tags, state, className) {
    return (tags || []).map(function (tag) {
      var active = state && state.tag === tag ? ' active' : '';
      return '<button type="button" class="tag' + active + '" data-tag="' + esc(tag) + '">' +
        esc(tag) + '</button>';
    }).join('');
  }

  function socialLinks(className) {
    var socials = Array.isArray(config.socials) ? config.socials : [];
    return socials.map(function (social) {
      var external = /^https?:/i.test(social.url || '');
      return '<a class="' + (className || 'social-link') + '" href="' + esc(social.url || '#') + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        icon(iconForSocial(social.name)) + esc(social.name) + '</a>';
    }).join('');
  }

  /* ---------- 文章卡片 ---------- */
  function postCard(post, state) {
    var category = post.category || '未分类';
    var excerpt = post.excerpt || '';
    return (
      '<article class="card" data-slug="' + esc(post.slug) + '">' +
        '<div class="card-meta">' +
          '<span class="card-category" data-category="' + esc(category) + '">' + esc(category) + '</span>' +
          '<span class="card-meta-item">' + icon('calendar') + esc(formatDate(post.date)) + '</span>' +
        '</div>' +
        '<h2 class="card-title"><a href="' + postUrl(post) + '">' + esc(post.title) + '</a></h2>' +
        '<p class="card-excerpt">' + esc(excerpt) + '</p>' +
        '<div class="card-bottom">' +
          '<div class="card-tags">' + tagButtons(post.tags, state) + '</div>' +
          '<a class="card-read-more" href="' + postUrl(post) + '">阅读全文' + icon('arrowRight') + '</a>' +
        '</div>' +
      '</article>'
    );
  }

  function postList(posts, state) {
    if (!posts.length) {
      return (
        '<div class="empty-state">' +
          '<div class="empty-icon">' + icon('search') + '</div>' +
          '<p class="empty-title">没有找到匹配的文章</p>' +
          '<p class="empty-desc">换个关键词，或者清除筛选条件再看看。</p>' +
          '<button type="button" class="btn btn-soft" data-clear-filters>清除筛选</button>' +
        '</div>'
      );
    }
    return posts.map(function (post) { return postCard(post, state); }).join('');
  }

  /* ---------- 筛选条 ---------- */
  function filterBar(state, count) {
    if (!state || (!state.search && !state.tag && !state.category)) return '';
    var parts = [];
    if (state.search) parts.push('搜索 <strong>“' + esc(state.search) + '”</strong>');
    if (state.tag) parts.push('标签 <strong>#' + esc(state.tag) + '</strong>');
    if (state.category) parts.push('分类 <strong>' + esc(state.category) + '</strong>');
    return (
      '<div class="filter-bar" id="filterBar">' +
        '<div class="filter-bar-label">' + icon('search') +
          '<span>筛选：' + parts.join('，') + '</span>' +
          '<span class="filter-bar-badge">' + count + ' 篇</span>' +
        '</div>' +
        '<button type="button" class="filter-bar-clear" data-clear-filters>' + icon('close') + '清除筛选</button>' +
      '</div>'
    );
  }

  /* ---------- Hero ---------- */
  function heroStats(stats) {
    return (
      '<div class="hero-stats">' +
        '<div class="hero-stat"><strong>' + stats.posts + '</strong><span>篇文章</span></div>' +
        '<div class="hero-stat"><strong>' + stats.categories + '</strong><span>个分类</span></div>' +
        '<div class="hero-stat"><strong>' + stats.tags + '</strong><span>个标签</span></div>' +
      '</div>'
    );
  }

  function heroTitle() {
    var title = config.heroTitle || config.tagline || '记录技术与生活';
    var gradient = config.heroGradient || '';
    var safeTitle = esc(title);
    if (gradient) {
      var safeGradient = esc(gradient);
      var index = safeTitle.indexOf(safeGradient);
      if (index !== -1) {
        safeTitle = safeTitle.slice(0, index) +
          '<span class="hero-accent">' + safeGradient + '</span>' +
          safeTitle.slice(index + safeGradient.length);
      }
    }
    return safeTitle;
  }

  function hero(stats) {
    return (
      '<section class="hero">' +
        '<div class="hero-inner">' +
          '<span class="hero-badge"><span class="dot"></span>' +
            esc(config.brand || config.author || '') + ' · 个人博客</span>' +
          '<h1 class="hero-title">' + heroTitle() + '</h1>' +
          '<p class="hero-desc">' + esc(config.description || config.bio || '') + '</p>' +
          '<div class="hero-actions">' +
            '<button type="button" class="btn btn-primary" data-scroll-to="postList">' +
              icon('book') + '浏览文章</button>' +
            '<a class="btn btn-ghost" href="#/about">' + icon('user') + '关于我</a>' +
          '</div>' +
          heroStats(stats) +
        '</div>' +
      '</section>'
    );
  }

  /* ---------- 侧栏 ---------- */
  function authorCard(stats) {
    var socials = socialLinks();
    return (
      '<div class="sidebar-card author-card">' +
        '<div class="author-avatar">' + esc(config.avatarText || config.author || 'pzx') + '</div>' +
        '<p class="author-name">' + esc(config.author || '') + '</p>' +
        '<span class="author-role">' + esc(config.role || '') + '</span>' +
        '<p class="author-bio">' + esc(config.bio || '') + '</p>' +
        '<div class="author-stats">' +
          '<div class="author-stat"><strong>' + stats.posts + '</strong><span>文章</span></div>' +
          '<div class="author-stat"><strong>' + stats.categories + '</strong><span>分类</span></div>' +
          '<div class="author-stat"><strong>' + stats.tags + '</strong><span>标签</span></div>' +
        '</div>' +
        '<div class="author-socials">' +
          '<a class="social-link" href="#/about">' + icon('user') + '关于我</a>' +
          socials +
        '</div>' +
      '</div>'
    );
  }

  function categoriesCard(categories, state) {
    var items = [
      '<li><button type="button" class="category-btn' +
        (!state || !state.category ? ' active' : '') + '" data-category="">' +
        '<span>全部文章</span><span class="count">' + (state ? state.totalPosts || '' : '') + '</span>' +
        '</button></li>'
    ].concat(categories.map(function (category) {
      return '<li><button type="button" class="category-btn' +
        (state && state.category === category.name ? ' active' : '') +
        '" data-category="' + esc(category.name) + '">' +
        '<span>' + esc(category.name) + '</span><span class="count">' + category.count + '</span>' +
        '</button></li>';
    }));
    return (
      '<div class="sidebar-card">' +
        '<div class="sidebar-card-title">' + icon('folder') + '分类</div>' +
        '<ul class="category-list">' + items.join('') + '</ul>' +
      '</div>'
    );
  }

  function tagsCard(tags, state) {
    return (
      '<div class="sidebar-card">' +
        '<div class="sidebar-card-title">' + icon('tag') + '标签</div>' +
        '<div class="tag-cloud">' + tagButtons(tags.map(function (tag) { return tag.name; }), state) + '</div>' +
      '</div>'
    );
  }

  function noteCard() {
    return (
      '<div class="sidebar-card">' +
        '<div class="sidebar-card-title">' + icon('info') + '关于本站</div>' +
        '<p class="sidebar-note">本站没有数据库，也没有构建步骤：文章就是 <code>content/posts/</code> ' +
          '下的 Markdown 文件，元数据写在 <code>js/config.js</code> 里。</p>' +
      '</div>'
    );
  }

  /* ---------- 首页 ---------- */
  function home(options) {
    var opts = options || {};
    var posts = opts.posts || [];
    var categories = opts.categories || [];
    var tags = opts.tags || [];
    var stats = opts.stats || { posts: 0, categories: 0, tags: 0 };
    var state = opts.state || { search: '', tag: '', category: '', totalPosts: stats.posts };

    return (
      hero(stats) +
      '<div class="home-layout">' +
        '<div class="home-main">' +
          '<div class="section-heading">' +
            '<div class="section-heading-left"><span class="section-heading-bar"></span>最新文章</div>' +
            '<span class="section-heading-count" id="postCount">共 ' + posts.length + ' 篇</span>' +
          '</div>' +
          '<div id="filterBarSlot">' + filterBar(state, posts.length) + '</div>' +
          '<div class="card-list" id="postList">' + postList(posts, state) + '</div>' +
        '</div>' +
        '<aside class="sidebar">' +
          authorCard(stats) +
          categoriesCard(categories, state) +
          tagsCard(tags, state) +
          noteCard() +
        '</aside>' +
      '</div>'
    );
  }

  /* ---------- 文章详情 ---------- */
  function articleNavLink(post, direction) {
    if (!post) {
      return '<div class="article-nav-empty">' +
        (direction === 'newer' ? '已经是最新一篇' : '已经是最后一篇') +
        '</div>';
    }
    var label = direction === 'newer' ? '较新的一篇' : '更早的一篇';
    var arrow = direction === 'newer' ? 'arrowLeft' : 'arrowRight';
    return (
      '<a class="article-nav-link ' + (direction === 'newer' ? 'prev' : 'next') + '" href="' + postUrl(post) + '">' +
        '<span class="article-nav-label">' +
          (direction === 'newer' ? icon('arrowLeft') : '') + label +
          (direction === 'newer' ? '' : icon('arrowRight')) +
        '</span>' +
        '<span class="article-nav-title">' + esc(post.title) + '</span>' +
      '</a>'
    );
  }

  function article(post, markdownSource, options) {
    var opts = options || {};
    var posts = opts.posts || getPublishedPosts();
    var index = posts.findIndex(function (item) { return item.slug === post.slug; });
    var newer = index > 0 ? posts[index - 1] : null;
    var older = index !== -1 && index < posts.length - 1 ? posts[index + 1] : null;
    var category = post.category || '未分类';
    var minutes = readingTime(markdownSource);
    var tags = post.tags || [];

    return (
      '<div class="article-page">' +
        '<div class="reading-progress" aria-hidden="true">' +
          '<div class="reading-progress-bar" id="readingProgressBar"></div>' +
        '</div>' +
        '<article class="article-detail">' +
          '<div class="article-breadcrumb">' +
            '<a class="back-link" href="#/">' + icon('arrowLeft') + '返回文章列表</a>' +
            '<div class="breadcrumb-path">' +
              '<a href="#/">首页</a>' +
              '<span class="breadcrumb-sep">/</span>' +
              '<span>' + esc(category) + '</span>' +
              '<span class="breadcrumb-sep">/</span>' +
              '<span class="breadcrumb-current">正文</span>' +
            '</div>' +
          '</div>' +
          '<header class="article-header">' +
            '<span class="article-kicker">' + esc(category) + '</span>' +
            '<h1 class="article-title">' + esc(post.title) + '</h1>' +
            '<div class="article-meta">' +
              '<span class="article-meta-item">' + icon('calendar') + esc(formatDate(post.date)) + '</span>' +
              '<span class="article-meta-item">' + icon('clock') + '约 ' + minutes + ' 分钟</span>' +
              '<span class="article-meta-tags">' + tagButtons(tags, null) + '</span>' +
              '<button type="button" class="article-copy-link" data-copy-link>' +
                icon('link') + '复制链接</button>' +
            '</div>' +
          '</header>' +
          '<div class="prose" id="articleContent">' + (opts.html || '') + '</div>' +
          '<footer class="article-footer">' +
            '<div class="article-nav">' +
              articleNavLink(newer, 'newer') +
              articleNavLink(older, 'older') +
            '</div>' +
            '<div class="article-back-home">' +
              '<a class="btn btn-soft" href="#/">' + icon('arrowLeft') + '返回首页</a>' +
            '</div>' +
          '</footer>' +
        '</article>' +
      '</div>'
    );
  }

  /* ---------- 关于页 ---------- */
  function about(markdownHtml, stats) {
    var socials = socialLinks();
    return (
      '<div class="about-page">' +
        '<section class="about-hero">' +
          '<div class="about-avatar">' + esc(config.avatarText || config.author || 'pzx') + '</div>' +
          '<div class="about-intro">' +
            '<span class="about-badge">' + icon('sparkles') + 'About</span>' +
            '<h1 class="about-title">你好，我是 <span>' + esc(config.author || '') + '</span></h1>' +
            '<p class="about-role">' + esc(config.role || '') + '</p>' +
            '<p class="about-bio">' + esc(config.bio || '') + '</p>' +
            (socials ? '<div class="about-socials">' + socials + '</div>' : '') +
          '</div>' +
        '</section>' +
        '<div class="about-layout">' +
          '<article class="about-content prose">' + markdownHtml + '</article>' +
          '<aside class="about-sidebar">' +
            '<div class="sidebar-card">' +
              '<div class="sidebar-card-title">' + icon('layers') + '本站技术</div>' +
              '<ul class="tech-list">' +
                (config.siteTech || []).map(function (tech) {
                  return '<li class="tech-item"><strong>' + esc(tech.name) + '</strong>' +
                    '<span>' + esc(tech.note) + '</span></li>';
                }).join('') +
              '</ul>' +
            '</div>' +
            '<div class="sidebar-card">' +
              '<div class="sidebar-card-title">' + icon('sparkles') + '站点数据</div>' +
              '<div class="author-stats" style="margin-top:0;border:0;padding:0">' +
                '<div class="author-stat"><strong>' + stats.posts + '</strong><span>文章</span></div>' +
                '<div class="author-stat"><strong>' + stats.categories + '</strong><span>分类</span></div>' +
                '<div class="author-stat"><strong>' + stats.tags + '</strong><span>标签</span></div>' +
              '</div>' +
              '<p class="sidebar-note" style="margin-top:16px">最近更新：' +
                esc(stats.latestDate ? formatDate(stats.latestDate) : '—') + '</p>' +
            '</div>' +
            noteCard() +
          '</aside>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- 状态页 ---------- */
  function notFound() {
    return (
      '<div class="not-found">' +
        '<div class="not-found-code">404</div>' +
        '<h1 class="not-found-title">这个页面不存在</h1>' +
        '<p class="not-found-desc">可能是链接写错了，或者这篇文章已经被移动。回到首页看看吧。</p>' +
        '<a class="btn btn-primary" href="#/">' + icon('home') + '回到首页</a>' +
      '</div>'
    );
  }

  function loading(text) {
    return (
      '<div class="loading-state">' +
        '<span class="spinner" role="status" aria-label="加载中"></span>' +
        '<p class="loading-text">' + esc(text || '正在加载…') + '</p>' +
      '</div>'
    );
  }

  function error(message, retryable) {
    return (
      '<div class="error-state">' +
        '<div class="empty-icon">' + icon('file') + '</div>' +
        '<p class="empty-title">内容加载失败</p>' +
        '<p class="empty-desc">' + esc(message || '请稍后重试。') + '</p>' +
        (retryable ? '<button type="button" class="btn btn-soft" data-retry>重新加载</button>' : '') +
        '<a class="back-link" href="#/">' + icon('arrowLeft') + '返回首页</a>' +
      '</div>'
    );
  }

  function fileProtocolNotice() {
    return (
      '<div class="error-state">' +
        '<div class="empty-icon">' + icon('info') + '</div>' +
        '<p class="empty-title">请通过本地服务器打开</p>' +
        '<p class="empty-desc">浏览器不允许 <code>file://</code> 协议读取 Markdown 文件。' +
          '在项目目录运行 <code>node tools/serve.mjs</code> 或 <code>python -m http.server 8000</code>，' +
          '然后访问 http://localhost:8000 。</p>' +
        '<a class="back-link" href="#/">' + icon('arrowLeft') + '返回首页</a>' +
      '</div>'
    );
  }

  global.Renderer = {
    icons: ICONS,
    icon: icon,
    escapeHtml: esc,
    getPublishedPosts: getPublishedPosts,
    getPostBySlug: getPostBySlug,
    getCategories: function (posts) { return countBy(posts || getPublishedPosts(), 'category'); },
    getTags: function (posts) { return countBy(posts || getPublishedPosts(), 'tags'); },
    formatDate: formatDate,
    readingTime: readingTime,
    home: home,
    postCard: postCard,
    postList: postList,
    filterBar: filterBar,
    article: article,
    about: about,
    notFound: notFound,
    loading: loading,
    error: error,
    fileProtocolNotice: fileProtocolNotice
  };
})(typeof window !== 'undefined' ? window : this);
