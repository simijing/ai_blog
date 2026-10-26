/* ==========================================================================
   router.js —— 基于 hash 的极简前端路由
   --------------------------------------------------------------------------
   使用 hash 路由的原因：纯静态托管（GitHub Pages / EdgeOne Pages）不需要
   服务端 rewrite，刷新任意地址都不会 404，部署零配置。
   路由表：
     #/               首页（文章列表）
     #/about          关于
     #/post/<slug>    文章详情
     其它             404
   ========================================================================== */
(function (global) {
  'use strict';

  var Router = {
    onRoute: null,

    init: function (onRoute) {
      this.onRoute = onRoute;
      window.addEventListener('hashchange', this.handle.bind(this));
      this.handle();
    },

    parse: function () {
      var raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || raw === '/') return { name: 'home', path: '/' };

      var clean = raw.split('?')[0];
      var segments = clean.split('/').filter(Boolean).map(function (segment) {
        try {
          return decodeURIComponent(segment);
        } catch (error) {
          return segment;
        }
      });

      if (segments.length === 1 && segments[0] === 'about') {
        return { name: 'about', path: '/about' };
      }

      if (segments.length === 2 && segments[0] === 'post') {
        return { name: 'post', slug: segments[1], path: '/' + segments.join('/') };
      }

      return { name: 'notFound', path: '/' + segments.join('/') };
    },

    handle: function () {
      if (typeof this.onRoute === 'function') {
        this.onRoute(this.parse());
      }
    },

    go: function (path) {
      var target = path.charAt(0) === '#' ? path : '#' + path;
      if (window.location.hash === target) {
        this.handle();
        return;
      }
      window.location.hash = target;
    }
  };

  global.Router = Router;
})(typeof window !== 'undefined' ? window : this);
