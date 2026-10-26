/*!
 * markdown.js —— 零依赖 Markdown → HTML 渲染器
 * --------------------------------------------------------------------------
 * 为什么自己写：这个博客坚持「纯 HTML + CSS + JavaScript」、无构建、无第三方
 * 库、无 CDN。文章内容只在本站出现，语法范围可控，因此实现一个够用、可读、
 * 默认转义的解析器，比引入一个 50KB 的通用库更合适。
 *
 * 支持：标题、段落、粗体、斜体、删除线、行内代码、围栏代码块（带语言标记）、
 *       引用、有序 / 无序 / 嵌套列表、表格（含对齐）、分割线、链接、图片、
 *       行尾双空格硬换行；所有文本一律转义，不执行内联 HTML。
 * 用法：Markdown.parse('# 标题\n\n正文') → HTML 字符串
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Markdown = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var PLACEHOLDER = '\u0000';
  var PLACEHOLDER_RE = /\u0000K(\d+)\u0000/g;

  var LANG_LABELS = {
    js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
    jsx: 'JSX', tsx: 'TSX', css: 'CSS', scss: 'SCSS', less: 'Less', html: 'HTML',
    xml: 'XML', json: 'JSON', jsonc: 'JSON', bash: 'Bash', sh: 'Shell', shell: 'Shell',
    zsh: 'Shell', powershell: 'PowerShell', ps1: 'PowerShell', python: 'Python',
    py: 'Python', c: 'C', h: 'C', cpp: 'C++', 'c++': 'C++', java: 'Java', go: 'Go',
    rust: 'Rust', sql: 'SQL', yml: 'YAML', yaml: 'YAML', md: 'Markdown',
    markdown: 'Markdown', diff: 'Diff', patch: 'Diff', text: '纯文本', txt: '纯文本',
    plaintext: '纯文本', nginx: 'Nginx', dockerfile: 'Dockerfile', ini: 'INI',
    toml: 'TOML', http: 'HTTP', graphql: 'GraphQL'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* 只放行常见安全协议与相对路径，拦截 javascript: / data: 等。 */
  function safeUrl(url) {
    var value = String(url == null ? '' : url).trim();
    if (!value) return '#';
    if (/^(https?:|mailto:|tel:)/i.test(value)) return escapeHtml(value);
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return '#';
    return escapeHtml(value);
  }

  function parseInline(text) {
    if (text == null || text === '') return '';

    var stash = [];
    function keep(html) {
      stash.push(html);
      return PLACEHOLDER + 'K' + (stash.length - 1) + PLACEHOLDER;
    }

    var source = String(text);

    /* 1. 行内代码优先抽出，避免内部字符被当成强调 / 链接语法 */
    source = source.replace(/`([^`\n]+)`/g, function (_, code) {
      return keep('<code>' + escapeHtml(code) + '</code>');
    });

    /* 2. 图片 */
    source = source.replace(/!\[([^\]]*)\]\(\s*([^)\s]+?)(?:\s+["']([^"']*)["'])?\s*\)/g,
      function (_, alt, url, title) {
        var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
        return keep('<img src="' + safeUrl(url) + '" alt="' + escapeHtml(alt) + '"' + titleAttr +
          ' loading="lazy" decoding="async">');
      });

    /* 3. 链接（外链自动补 target / rel） */
    source = source.replace(/\[([^\]]+)\]\(\s*([^)\s]+?)(?:\s+["']([^"']*)["'])?\s*\)/g,
      function (_, label, url, title) {
        var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
        var isExternal = /^https?:\/\//i.test(url);
        var extra = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return keep('<a href="' + safeUrl(url) + '"' + titleAttr + extra + '>' + parseInline(label) + '</a>');
      });

    /* 4. 其余文本统一转义 */
    source = escapeHtml(source);

    /* 5. 强调 */
    source = source.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    source = source.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    source = source.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    source = source.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
    source = source.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

    /* 6. 还原行内代码与链接 */
    source = source.replace(PLACEHOLDER_RE, function (_, index) {
      return stash[Number(index)] || '';
    });

    /* 7. 行尾两个及以上空格 → 硬换行 */
    source = source.replace(/ {2,}\n/g, '<br>\n');

    return source;
  }

  function headingMatch(line) {
    var match = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    return match ? { level: match[1].length, text: match[2] } : null;
  }

  function splitRow(line) {
    var trimmed = String(line).trim().replace(/^\|/, '').replace(/\|$/, '');
    var cells = [];
    var current = '';
    var escaped = false;
    for (var i = 0; i < trimmed.length; i++) {
      var ch = trimmed.charAt(i);
      if (escaped) {
        current += ch === '|' ? '|' : '\\' + ch;
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '|') {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function isTableSeparator(line) {
    if (line.indexOf('|') === -1) return false;
    var cells = splitRow(line);
    if (!cells.length) return false;
    return cells.every(function (cell) { return /^:?-{3,}:?$/.test(cell); });
  }

  function parseList(lines, start) {
    var entries = [];
    var baseIndent = null;
    var current = null;
    var i = start;

    while (i < lines.length) {
      var line = lines[i];
      var marker = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/.exec(line);

      if (marker) {
        var indent = marker[1].replace(/\t/g, '    ').length;
        if (baseIndent === null) baseIndent = indent;
        if (indent < baseIndent) break;
        current = {
          indent: indent,
          ordered: /\d/.test(marker[2]),
          text: marker[3],
          children: []
        };
        entries.push(current);
        i++;
        continue;
      }

      if (/^\s*$/.test(line)) {
        var lookahead = i + 1;
        while (lookahead < lines.length && /^\s*$/.test(lines[lookahead])) lookahead++;
        if (lookahead < lines.length &&
            (/^\s*([-*+]|\d{1,9}[.)])\s+/.test(lines[lookahead]) || /^\s{2,}\S/.test(lines[lookahead]))) {
          i = lookahead;
          continue;
        }
        break;
      }

      if (current && /^\s+\S/.test(line)) {
        current.text += ' ' + line.trim();
        i++;
        continue;
      }

      break;
    }

    if (!entries.length) return { html: '', next: start };

    function build(indent, startIndex) {
      var node = { ordered: entries[startIndex].ordered, items: [] };
      var cursor = startIndex;
      while (cursor < entries.length) {
        var entry = entries[cursor];
        if (entry.indent < indent) break;
        if (entry.indent > indent) break;
        if (entry.ordered !== node.ordered) break;
        var item = { text: entry.text, children: [] };
        node.items.push(item);
        cursor++;
        while (cursor < entries.length && entries[cursor].indent > indent) {
          var child = build(entries[cursor].indent, cursor);
          item.children.push(child.node);
          if (child.next <= cursor) { cursor++; break; }
          cursor = child.next;
        }
      }
      return { node: node, next: cursor };
    }

    function renderNode(node) {
      var tag = node.ordered ? 'ol' : 'ul';
      var output = '<' + tag + '>';
      node.items.forEach(function (item) {
        output += '<li>' + parseInline(item.text);
        item.children.forEach(function (child) { output += renderNode(child); });
        output += '</li>';
      });
      output += '</' + tag + '>';
      return output;
    }

    var parts = [];
    var cursor = 0;
    var guard = 0;
    while (cursor < entries.length && guard++ < 500) {
      var result = build(entries[cursor].indent, cursor);
      parts.push(renderNode(result.node));
      if (result.next <= cursor) break;
      cursor = result.next;
    }

    /* next 必须返回「行号」而不是条目下标：parse() 会从这一行继续解析。 */
    return { html: parts.join('\n'), next: i };
  }

  function parse(markdown) {
    var text = String(markdown == null ? '' : markdown)
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '    ');

    if (!text.trim()) return '';

    var lines = text.split('\n');
    var html = [];
    var paragraph = [];
    var usedIds = Object.create(null);
    var i = 0;

    function uniqueId(raw) {
      var base = String(raw)
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[`*_~!\[\]()#]/g, '')
        .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!base) base = 'section';
      var id = base;
      var suffix = 2;
      while (usedIds[id]) {
        id = base + '-' + suffix;
        suffix++;
      }
      usedIds[id] = true;
      return id;
    }

    function flushParagraph() {
      if (!paragraph.length) return;
      html.push('<p>' + parseInline(paragraph.join('\n').trim()) + '</p>');
      paragraph = [];
    }

    while (i < lines.length) {
      var line = lines[i];

      /* 空行 */
      if (/^\s*$/.test(line)) {
        flushParagraph();
        i++;
        continue;
      }

      /* 围栏代码块 */
      var fence = /^ {0,3}(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)\s*$/.exec(line);
      if (fence) {
        flushParagraph();
        var marker = fence[1];
        var lang = (fence[2] || '').toLowerCase();
        var codeLines = [];
        i++;
        while (i < lines.length) {
          var closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
          if (closing && closing[1].charAt(0) === marker.charAt(0) && closing[1].length >= marker.length) {
            i++;
            break;
          }
          codeLines.push(lines[i]);
          i++;
        }
        var label = LANG_LABELS[lang] || (lang ? lang.toUpperCase() : '纯文本');
        html.push(
          '<div class="code-block" data-lang="' + escapeHtml(lang) + '">' +
            '<div class="code-head">' +
              '<span class="code-lang">' + escapeHtml(label) + '</span>' +
              '<button type="button" class="code-copy" data-copy>复制</button>' +
            '</div>' +
            '<pre><code' + (lang ? ' class="language-' + escapeHtml(lang) + '"' : '') + '>' +
              escapeHtml(codeLines.join('\n')) +
            '</code></pre>' +
          '</div>'
        );
        continue;
      }

      /* 标题 */
      var heading = headingMatch(line);
      if (heading) {
        flushParagraph();
        html.push('<h' + heading.level + ' id="' + uniqueId(heading.text) + '">' +
          parseInline(heading.text) + '</h' + heading.level + '>');
        i++;
        continue;
      }

      /* 分割线 */
      if (/^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)) {
        flushParagraph();
        html.push('<hr>');
        i++;
        continue;
      }

      /* 引用块（支持嵌套 Markdown） */
      if (/^ {0,3}>\s?/.test(line)) {
        flushParagraph();
        var quoteLines = [];
        while (i < lines.length && /^ {0,3}>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^ {0,3}>\s?/, ''));
          i++;
        }
        html.push('<blockquote>' + parse(quoteLines.join('\n')) + '</blockquote>');
        continue;
      }

      /* 表格 */
      if (line.indexOf('|') !== -1 && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        flushParagraph();
        var header = splitRow(line);
        var alignments = splitRow(lines[i + 1]).map(function (cell) {
          var left = /^:/.test(cell);
          var right = /:$/.test(cell);
          if (left && right) return 'center';
          if (right) return 'right';
          if (left) return 'left';
          return '';
        });
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && !/^\s*$/.test(lines[i]) && !isTableSeparator(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        var table = '<div class="table-wrap"><table><thead><tr>';
        header.forEach(function (cell, index) {
          var style = alignments[index] ? ' style="text-align:' + alignments[index] + '"' : '';
          table += '<th' + style + '>' + parseInline(cell) + '</th>';
        });
        table += '</tr></thead><tbody>';
        rows.forEach(function (row) {
          table += '<tr>';
          for (var cellIndex = 0; cellIndex < header.length; cellIndex++) {
            var style = alignments[cellIndex] ? ' style="text-align:' + alignments[cellIndex] + '"' : '';
            table += '<td' + style + '>' + parseInline(row[cellIndex] || '') + '</td>';
          }
          table += '</tr>';
        });
        table += '</tbody></table></div>';
        html.push(table);
        continue;
      }

      /* 列表 */
      if (/^ {0,3}([-*+]|\d{1,9}[.)])\s+/.test(line)) {
        flushParagraph();
        var list = parseList(lines, i);
        if (list.html) html.push(list.html);
        if (list.next <= i) { i++; } else { i = list.next; }
        continue;
      }

      /* 普通段落 */
      paragraph.push(line);
      i++;
    }

    flushParagraph();
    return html.join('\n');
  }

  return {
    parse: parse,
    parseInline: parseInline,
    escapeHtml: escapeHtml
  };
});
