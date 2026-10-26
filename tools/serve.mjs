#!/usr/bin/env node
/**
 * tools/serve.mjs —— 零依赖本地静态预览服务器
 * --------------------------------------------------------------------------
 * 为什么需要它：浏览器的安全策略不允许 file:// 页面 fetch 本地 Markdown，
 * 双击 index.html 会导致文章加载失败。这个脚本只做一件事：把仓库根目录
 * 当作静态站点服务出去，方便本地预览。
 *
 * 用法：
 *   node tools/serve.mjs
 *   node tools/serve.mjs --port 3000
 *   PORT=8080 node tools/serve.mjs
 *   npm 里等价：npx serve .
 *
 * 它和线上部署无关：GitHub Pages / EdgeOne Pages 直接托管静态文件即可。
 */
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
};

function parsePort(argv) {
  const flagIndex = argv.findIndex((arg) => arg === '--port' || arg === '-p');
  const fromFlag = flagIndex !== -1 ? Number(argv[flagIndex + 1]) : NaN;
  const fromEnv = Number(process.env.PORT);
  const port = Number.isFinite(fromFlag) ? fromFlag : Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_PORT;
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT;
}

const port = parsePort(process.argv.slice(2));
const host = process.env.HOST || '127.0.0.1';

function sendText(res, statusCode, text, extraHeaders) {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

async function serveFile(req, res, filePath, statusCode = 200) {
  const info = await stat(filePath);
  const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': info.size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  } catch {
    sendText(res, 400, 'Bad Request');
    return;
  }

  if (pathname === '/' || pathname === '') pathname = '/index.html';

  /* 阻止 ../ 穿越到工作目录之外 */
  const filePath = resolve(ROOT, '.' + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  try {
    let target = filePath;
    let info = await stat(target);
    if (info.isDirectory()) {
      target = join(target, 'index.html');
      info = await stat(target);
    }
    if (!info.isFile()) throw new Error('Not a file');
    await serveFile(req, res, target);
  } catch {
    /* 无扩展名的路径按 SPA 处理，回退到 index.html；其它缺失文件返回 404 页面 */
    if (!extname(pathname)) {
      try {
        await serveFile(req, res, join(ROOT, 'index.html'));
        return;
      } catch {
        /* 继续走 404 */
      }
    }
    try {
      const notFoundPage = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': notFoundPage.length,
        'Cache-Control': 'no-store'
      });
      res.end(req.method === 'HEAD' ? undefined : notFoundPage);
    } catch {
      sendText(res, 404, '404 Not Found');
    }
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}/`;
  console.log('');
  console.log('  pzx 的博客 · 本地预览');
  console.log('  ' + url);
  console.log('');
  console.log('  按 Ctrl+C 停止');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，可以用 --port 换一个端口，例如：node tools/serve.mjs --port 3000`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
