/* ==========================================================================
   app.js —— 应用入口：路由分发、筛选搜索、交互增强
   --------------------------------------------------------------------------
   依赖加载顺序：config.js → markdown.js → renderer.js → router.js → app.js
   本文件负责：
     · 页面渲染与 hash 路由分发（首页 / 关于 / 文章详情 / 404）
     · 搜索、标签、分类筛选（纯前端，无后端接口）
     · 移动端菜单、回到顶部、阅读进度、代码复制、复制文章链接
     · 页脚年份、站点名称等由配置驱动的静态文案
   ========================================================================== */
(function (global) {
  'use strict';

  var config = global.SITE_CONFIG || { posts: [] };
  var R = global.Renderer;
  var Markdown = global.Markdown;
  var Router = global.Router;

  var state = {
    search: '',
    tag: '',
    category: '',
    totalPosts: 0
  };

  var refs = {};
  var currentRoute = null;
  var renderToken = 0;
  var searchTimer = null;
  var pendingScroll = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return R ? R.escapeHtml(value) : String(value == null ? '' : value);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    refs.app = byId('app');
    refs.main = byId('mainContent');
    refs.navbar = byId('navbar');
    refs.mobileToggle = byId('mobileToggle');
    refs.searchInput = byId('searchInput');
    refs.searchInputMobile = byId('searchInputMobile');
    refs.backToTop = byId('backToTop');
    refs.footerYear = byId('footerYear');

    applySiteConfig();
    bindEvents();
    Router.init(handleRoute);
  }

  /* 用 SITE_CONFIG 填充页面中静态文案，避免在 HTML 里写死站点信息。 */
  function applySiteConfig() {
    var brandName = byId('navBrandName');
    var tagline = byId('navTagline');
    var footerBrand = byId('footerBrandName');
    var footerDesc = byId('footerDesc');
    var footerAuthor = byId('footerAuthor');

    if (brandName) brandName.textContent = config.title || 'PZX 的博客';
    if (tagline) tagline.textContent = config.tagline || '';
    if (footerBrand) footerBrand.textContent = config.title || '';
    if (footerDesc) footerDesc.textContent = config.description || config.bio || '';
    if (footerAuthor) footerAuthor.textContent = config.author || '';
    if (refs.footerYear) refs.footerYear.textContent = String(new Date().getFullYear());

    var metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', config.description || '');
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
  }

  function handleDocumentClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    /* 跳过导航（skip link）：只把焦点移到主内容，不能触发 hash 路由 */
    if (target.closest('.skip-link')) {
      event.preventDefault();
      if (refs.main) refs.main.focus();
      return;
    }

    /* 移动端菜单开关 */
    if (target.closest('#mobileToggle')) {
      toggleMenu();
      return;
    }

    /* 点击导航链接后收起移动菜单 */
    if (target.closest('.nav-link') || target.closest('.nav-brand-text')) {
      closeMenu();
    }

    /* 页内滚动按钮（Hero 的「浏览文章」） */
    var scrollTrigger = target.closest('[data-scroll-to]');
    if (scrollTrigger) {
      event.preventDefault();
      scrollToId(scrollTrigger.getAttribute('data-scroll-to'));
      return;
    }

    /* 标签筛选 */
    var tagButton = target.closest('[data-tag]');
    if (tagButton) {
      event.preventDefault();
      toggleTag(tagButton.getAttribute('data-tag'));
      return;
    }

    /* 分类筛选 */
    var categoryButton = target.closest('.category-btn[data-category]');
    if (categoryButton) {
      event.preventDefault();
      selectCategory(categoryButton.getAttribute('data-category'));
      return;
    }

    /* 清除全部筛选 */
    if (target.closest('[data-clear-filters]')) {
      event.preventDefault();
      clearFilters();
      return;
    }

    /* 清除搜索词 */
    if (target.closest('[data-clear-search]')) {
      event.preventDefault();
      setSearch('', true);
      return;
    }

    /* 代码块复制 */
    var copyCodeButton = target.closest('[data-copy]');
    if (copyCodeButton) {
      event.preventDefault();
      copyCodeBlock(copyCodeButton);
      return;
    }

    /* 复制文章链接 */
    var copyLinkButton = target.closest('[data-copy-link]');
    if (copyLinkButton) {
      event.preventDefault();
      copyPageLink(copyLinkButton);
      return;
    }

    /* 加载失败重试 */
    if (target.closest('[data-retry]')) {
      event.preventDefault();
      Router.handle();
      return;
    }

    /* 点击菜单外区域收起菜单 */
    if (!target.closest('#navbar')) closeMenu();
  }

  function handleInput(event) {
    var input = event.target;
    if (!input || (input.id !== 'searchInput' && input.id !== 'searchInputMobile')) return;

    syncSearchInputs(input);
    updateSearchClearState();
    clearTimeout(searchTimer);

    var value = input.value;
    searchTimer = setTimeout(function () {
      state.search = value;
      if (currentRoute && currentRoute.name === 'home') {
        applyFilters();
      } else {
        pendingScroll = 'postList';
        Router.go('/');
      }
    }, 150);
  }

  function handleKeydown(event) {
    var target = event.target;
    var isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      focusSearch();
      return;
    }

    if (event.key === 'Escape') {
      if (refs.navbar && refs.navbar.classList.contains('menu-open')) {
        closeMenu();
        return;
      }
      if (state.search) {
        setSearch('', true);
        return;
      }
      if (isTyping) target.blur();
    }
  }

  function handleScroll() {
    if (refs.backToTop) {
      refs.backToTop.classList.toggle('visible', window.scrollY > 420);
    }
    updateReadingProgress();
  }

  function handleResize() {
    if (window.innerWidth > 900) closeMenu();
  }

  /* ---------- 菜单 ---------- */
  function toggleMenu() {
    if (!refs.navbar) return;
    var open = refs.navbar.classList.toggle('menu-open');
    if (refs.mobileToggle) {
      refs.mobileToggle.setAttribute('aria-expanded', String(open));
      refs.mobileToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    }
  }

  function closeMenu() {
    if (!refs.navbar) return;
    if (!refs.navbar.classList.contains('menu-open')) return;
    refs.navbar.classList.remove('menu-open');
    if (refs.mobileToggle) {
      refs.mobileToggle.setAttribute('aria-expanded', 'false');
      refs.mobileToggle.setAttribute('aria-label', '打开菜单');
    }
  }

  /* ---------- 路由分发 ---------- */
  function handleRoute(route) {
    /* 路由切换时取消尚未触发的搜索防抖，避免它把用户带回首页 */
    clearTimeout(searchTimer);
    currentRoute = route;
    renderToken++;
    closeMenu();

    if (route.name === 'about') {
      renderAbout();
      return;
    }
    if (route.name === 'post') {
      renderPost(route.slug);
      return;
    }
    if (route.name === 'home') {
      renderHome();
      return;
    }
    renderNotFound();
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var posts = R.getPublishedPosts();
    var categories = R.getCategories(posts);
    var tags = R.getTags(posts);
    var stats = buildStats(posts);
    state.totalPosts = posts.length;

    var filtered = filterPosts(posts);
    refs.app.innerHTML = '<div class="page-enter">' + R.home({
      posts: filtered,
      categories: categories,
      tags: tags,
      stats: stats,
      state: state
    }) + '</div>';

    updateNavActive('home');
    updateDocumentMeta(null, config.description);
    resetScroll();
    focusMain();
    refreshFilterUi();

    if (pendingScroll) {
      var targetId = pendingScroll;
      pendingScroll = null;
      window.setTimeout(function () { scrollToId(targetId); }, 80);
    }
  }

  function selectCategory(category) {
    state.category = state.category === category ? '' : category;
    if (state.category) state.tag = '';
    if (currentRoute && currentRoute.name === 'home') {
      applyFilters({ scrollToList: true });
    } else {
      pendingScroll = 'postList';
      Router.go('/');
    }
  }

  function toggleTag(tag) {
    state.tag = state.tag === tag ? '' : tag;
    if (state.tag) state.category = '';
    if (currentRoute && currentRoute.name === 'home') {
      applyFilters({ scrollToList: true });
    } else {
      pendingScroll = 'postList';
      Router.go('/');
    }
  }

  function setSearch(value, applyNow) {
    state.search = value || '';
    if (refs.searchInput) refs.searchInput.value = state.search;
    if (refs.searchInputMobile) refs.searchInputMobile.value = state.search;
    updateSearchClearState();
    if (applyNow) {
      if (currentRoute && currentRoute.name === 'home') {
        applyFilters();
      } else {
        pendingScroll = 'postList';
        Router.go('/');
      }
    }
  }

  function clearFilters() {
    state.search = '';
    state.tag = '';
    state.category = '';
    if (refs.searchInput) refs.searchInput.value = '';
    if (refs.searchInputMobile) refs.searchInputMobile.value = '';
    updateSearchClearState();
    if (currentRoute && currentRoute.name === 'home') {
      applyFilters({ scrollToList: true });
    } else {
      Router.go('/');
    }
  }

  function filterPosts(posts) {
    var keyword = String(state.search || '').trim().toLowerCase();
    return posts.filter(function (post) {
      if (state.tag && (post.tags || []).indexOf(state.tag) === -1) return false;
      if (state.category && post.category !== state.category) return false;
      if (keyword) {
        var haystack = [
          post.title,
          post.excerpt,
          post.category,
          (post.tags || []).join(' ')
        ].join(' ').toLowerCase();
        if (haystack.indexOf(keyword) === -1) return false;
      }
      return true;
    });
  }

  function applyFilters(options) {
    var opts = options || {};
    var list = byId('postList');
    if (!list) return;

    var filtered = filterPosts(R.getPublishedPosts());
    list.innerHTML = R.postList(filtered, state);

    var slot = byId('filterBarSlot');
    if (slot) slot.innerHTML = R.filterBar(state, filtered.length);

    var counter = byId('postCount');
    if (counter) counter.textContent = '共 ' + filtered.length + ' 篇';

    refreshFilterUi();

    if (opts.scrollToList) scrollToId('postList');
  }

  /* 搜索框清除按钮、侧栏分类/标签的选中态 */
  function refreshFilterUi() {
    updateSearchClearState();

    all('.category-btn[data-category]').forEach(function (button) {
      var category = button.getAttribute('data-category');
      button.classList.toggle('active', category === (state.category || ''));
    });

    all('.sidebar .tag[data-tag]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-tag') === state.tag);
    });
  }

  function syncSearchInputs(source) {
    var value = source.value;
    [refs.searchInput, refs.searchInputMobile].forEach(function (input) {
      if (input && input !== source) input.value = value;
    });
  }

  function updateSearchClearState() {
    [refs.searchInput, refs.searchInputMobile].forEach(function (input) {
      if (!input) return;
      var wrapper = input.closest('.nav-search');
      if (wrapper) wrapper.classList.toggle('has-value', input.value.length > 0);
    });
  }

  function focusSearch() {
    var mobile = window.innerWidth <= 900;
    var input = mobile ? refs.searchInputMobile : refs.searchInput;
    if (mobile && refs.navbar && !refs.navbar.classList.contains('menu-open')) {
      toggleMenu();
      input = refs.searchInputMobile;
    }
    if (input) {
      window.setTimeout(function () { input.focus(); }, 80);
    }
  }

  /* ---------- 文章详情 ---------- */
  function renderPost(slug) {
    var post = R.getPostBySlug(slug);
    if (!post) {
      renderNotFound();
      return;
    }

    var token = ++renderToken;
    refs.app.innerHTML = '<div class="page-enter">' + R.loading('正在加载文章…') + '</div>';
    updateNavActive('home');
    updateDocumentMeta(post.title, post.excerpt || config.description);
    resetScroll();
    focusMain();

    fetchText('content/posts/' + encodeURIComponent(post.slug) + '.md')
      .then(function (markdown) {
        if (token !== renderToken) return;
        var html = Markdown.parse(markdown);
        var posts = R.getPublishedPosts();
        refs.app.innerHTML = '<div class="page-enter">' + R.article(post, markdown, {
          posts: posts,
          html: html
        }) + '</div>';
        updateReadingProgress();
      })
      .catch(function (error) {
        if (token !== renderToken) return;
        renderLoadError(error, '无法加载文章内容。请确认 content/posts/' + post.slug + '.md 存在。');
      });
  }

  /* ---------- 关于页 ---------- */
  function renderAbout() {
    var token = ++renderToken;
    refs.app.innerHTML = '<div class="page-enter">' + R.loading('正在加载关于页…') + '</div>';
    updateNavActive('about');
    updateDocumentMeta('关于', config.bio || config.description);
    resetScroll();
    focusMain();

    fetchText('content/about.md')
      .then(function (markdown) {
        if (token !== renderToken) return;
        var posts = R.getPublishedPosts();
        refs.app.innerHTML = '<div class="page-enter">' + R.about(
          Markdown.parse(markdown),
          buildStats(posts)
        ) + '</div>';
      })
      .catch(function (error) {
        if (token !== renderToken) return;
        renderLoadError(error, '无法加载 content/about.md。');
      });
  }

  /* ---------- 404 ---------- */
  function renderNotFound() {
    renderToken++;
    refs.app.innerHTML = '<div class="page-enter">' + R.notFound() + '</div>';
    updateNavActive('');
    updateDocumentMeta('页面不存在', config.description);
    resetScroll();
    focusMain();
  }

  /* ---------- 数据 / 元信息 ---------- */
  function buildStats(posts) {
    var categories = R.getCategories(posts);
    var tags = R.getTags(posts);
    return {
      posts: posts.length,
      categories: categories.length,
      tags: tags.length,
      latestDate: posts.length ? posts[0].date : ''
    };
  }

  function updateNavActive(name) {
    all('.nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-nav') === name);
    });
  }

  function updateDocumentMeta(title, description) {
    document.title = title ? title + ' · ' + (config.title || '博客') : (config.title || '博客');
    if (description) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }

  /* ---------- 内容加载 ---------- */
  function fetchText(url) {
    if (window.location.protocol === 'file:') {
      return Promise.reject(new Error('FILE_PROTOCOL'));
    }
    return fetch(url, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.text();
    });
  }

  function renderLoadError(error, hint) {
    if (error && error.message === 'FILE_PROTOCOL') {
      refs.app.innerHTML = '<div class="page-enter">' + R.fileProtocolNotice() + '</div>';
      return;
    }
    var detail = hint || '';
    if (error && error.message) detail += '（' + error.message + '）';
    refs.app.innerHTML = '<div class="page-enter">' + R.error(detail, true) + '</div>';
  }

  /* ---------- 复制 ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-1000px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        var ok = document.execCommand('copy');
        if (ok) resolve();
        else reject(new Error('浏览器不支持自动复制'));
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  function flashButton(button, label, className) {
    if (!button) return;
    if (!button.getAttribute('data-label')) {
      button.setAttribute('data-label', button.textContent.trim());
    }
    button.textContent = label;
    button.classList.add(className || 'copied');
    window.clearTimeout(button._feedbackTimer);
    button._feedbackTimer = window.setTimeout(function () {
      button.textContent = button.getAttribute('data-label');
      button.classList.remove(className || 'copied');
    }, 1600);
  }

  function copyCodeBlock(button) {
    var block = button.closest('.code-block');
    var code = block ? block.querySelector('code') : null;
    if (!code) return;
    copyText(code.textContent).then(function () {
      flashButton(button, '已复制');
    }).catch(function () {
      flashButton(button, '复制失败');
    });
  }

  function copyPageLink(button) {
    var url = window.location.href;
    copyText(url).then(function () {
      flashButton(button, '链接已复制');
    }).catch(function () {
      flashButton(button, '复制失败');
    });
  }

  /* ---------- 滚动 / 进度条 ---------- */
  function scrollToId(id) {
    var element = byId(id);
    if (!element) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = element.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduced ? 'auto' : 'smooth'
    });
  }

  function resetScroll() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (refs.backToTop) refs.backToTop.classList.remove('visible');
  }

  function updateReadingProgress() {
    var bar = byId('readingProgressBar');
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var percent = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, percent)).toFixed(2) + '%';
  }

  function focusMain() {
    if (!refs.main) return;
    try {
      refs.main.focus({ preventScroll: true });
    } catch (error) {
      refs.main.focus();
    }
  }

  /* ---------- 启动 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.BlogApp = {
    state: state,
    applyFilters: applyFilters,
    filterPosts: filterPosts
  };
})(typeof window !== 'undefined' ? window : this);
