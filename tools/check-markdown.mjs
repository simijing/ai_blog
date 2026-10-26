/**
 * tools/check-markdown.mjs —— 内容自检脚本（可选，本地开发时使用）
 * --------------------------------------------------------------------------
 * 新增/修改文章后运行：
 *   node tools/check-markdown.mjs
 *
 * 检查内容：
 *   · js/config.js 中的 slug 与 content/posts/*.md 文件名是否一一对应；
 *   · 每篇文章的 Markdown 是否能被 js/markdown.js 正常解析；
 *   · 二级标题、列表与代码块等基础语法的渲染结果是否数量一致；
 *   · 是否误写了 H1（标题由 config.js 提供）。
 *
 * 这是开发辅助脚本，不参与线上部署，也不需要任何第三方依赖。
 */
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(import.meta.url);
const Markdown = require(join(ROOT, 'js/markdown.js'));

const problems = [];
let checks = 0;

function check(ok, message) {
  checks++;
  if (!ok) problems.push(message);
}

function stripFences(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let inside = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inside = !inside;
      continue;
    }
    if (!inside) out.push(line);
  }
  return out;
}

/* ---------- 读取配置 ---------- */
const configSource = await readFile(join(ROOT, 'js/config.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(configSource, sandbox, { filename: 'js/config.js' });
const config = sandbox.SITE_CONFIG;

if (!config || !Array.isArray(config.posts)) {
  console.error('✗ js/config.js 中没有找到 SITE_CONFIG.posts');
  process.exit(1);
}

const posts = config.posts.filter((post) => post && post.slug);
const files = (await readdir(join(ROOT, 'content/posts'))).filter((file) => file.endsWith('.md'));
const slugsFromConfig = posts.map((post) => post.slug).sort();
const slugsFromFiles = files.map((file) => file.replace(/\.md$/, '')).sort();

check(JSON.stringify(slugsFromConfig) === JSON.stringify(slugsFromFiles),
  'config.js 的 slug 与 content/posts 下的文件名不一致：\n' +
  '  config: ' + slugsFromConfig.join(', ') + '\n' +
  '  files : ' + slugsFromFiles.join(', '));

for (const post of posts) {
  const file = join(ROOT, 'content/posts', post.slug + '.md');
  let markdown = '';
  try {
    markdown = await readFile(file, 'utf8');
  } catch {
    check(false, '找不到正文文件 content/posts/' + post.slug + '.md');
    continue;
  }

  const stripped = stripFences(markdown);
  const html = Markdown.parse(markdown);

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const h2 = (html.match(/<h2[\s>]/g) || []).length;
  const expectedH2 = stripped.filter((line) => /^ {0,3}##\s+/.test(line)).length;
  const li = (html.match(/<li>/g) || []).length;
  const expectedLi = stripped.filter((line) => /^\s*([-*+]|\d{1,9}[.)])\s+/.test(line)).length;
  const fences = Math.floor((markdown.match(/^\s*```/gm) || []).length / 2);
  const codeBlocks = (html.match(/<div class="code-block"/g) || []).length;

  check(h2 > 0, post.slug + ': 缺少二级标题（##）');
  check(h1 === 0, post.slug + ': 正文不应包含 H1（标题由 js/config.js 提供）');
  check(h2 === expectedH2, post.slug + ': H2 数量异常（源文件 ' + expectedH2 + '，渲染 ' + h2 + '）');
  check(li === expectedLi, post.slug + ': 列表项数量异常（源文件 ' + expectedLi + '，渲染 ' + li + '）');
  check(codeBlocks === fences, post.slug + ': 代码块数量异常（源文件 ' + fences + '，渲染 ' + codeBlocks + '）');
  check(!/```/.test(html), post.slug + ': 渲染结果中有未闭合的代码围栏');
  check(!post.title || post.title.length > 0, post.slug + ': 缺少 title');
  check(/^\d{4}-\d{2}-\d{2}$/.test(String(post.date || '')), post.slug + ': date 应为 YYYY-MM-DD 格式');
}

/* 草稿也允许没有正文文件；上面只检查已发布文章 */
console.log('\n检查文章 ' + posts.length + ' 篇，执行断言 ' + checks + ' 项。');
if (problems.length) {
  console.error('\n发现 ' + problems.length + ' 个问题：');
  problems.forEach((problem) => console.error('  ✗ ' + problem));
  process.exitCode = 1;
} else {
  console.log('✓ 全部通过：配置与正文文件一致，Markdown 渲染正常。');
}
