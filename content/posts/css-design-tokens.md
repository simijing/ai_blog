## 问题从一行颜色开始

写前端项目时，我的 CSS 常常是这样的：颜色直接写在规则里，`#1f2328`、`#57606a`、`#d0d7de` 散落在十几个地方。等到想调深色模式，我才发现要改的位置比想象中多得多。不是改不动，而是每改一处都要担心漏掉另一处。

后来我把所有视觉决策抽成变量，问题才算解决。这套东西通常叫 design tokens，中文一般译作“设计令牌”。

## 三层变量

我的变量分三层，职责逐层收窄：

1. **基础层**：原始色板与尺度，只描述数值，不带语义；
2. **语义层**：说明这个颜色用在哪里，例如背景、正文、边框；
3. **组件层**：只在确实需要时出现，避免过早抽象。

除了颜色，间距和圆角也应该是变量。下面是一组最小示例：

```css
:root {
  /* 基础层 */
  --gray-900: #1f2328;
  --gray-600: #57606a;
  --blue-600: #0969da;
  --gray-200: #d0d7de;
  --radius-md: 8px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;

  /* 语义层 */
  --color-bg: #ffffff;
  --color-text: var(--gray-900);
  --color-muted: var(--gray-600);
  --color-link: var(--blue-600);
  --color-border: var(--gray-200);
  --radius-base: var(--radius-md);
}
```

间距用 4 和 8 的倍数，不是因为我崇尚某种“系统”，而是这样的数字在组合时不容易出现半像素和错位。`--space-3` 是 16px，用来分隔段落；`--space-4` 是 24px，用来分隔区块。

## 深色模式

深色模式不是简单反转颜色。我的做法是给 `<html>` 加一个属性，再用变量覆盖：

```css
:root[data-theme="dark"] {
  --color-bg: #0d1117;
  --color-text: #e6edf3;
  --color-muted: #8b949e;
  --color-link: #58a6ff;
  --color-border: #30363d;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0d1117;
    --color-text: #e6edf3;
  }
}
```

`prefers-color-scheme` 负责尊重系统设置，`data-theme` 负责用户手动覆盖。切换时只要一行：

```js
document.documentElement.dataset.theme = theme;
```

两者配合，才不会出现“系统是深色，但站点已经保存了浅色偏好”这种冲突。

## 组件只认语义层

组件样式里不应该出现十六进制颜色，也不应该直接引用基础层：

```css
.post-meta {
  color: var(--color-muted);
  font-size: 0.875rem;
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
}
```

这么写的好处是，组件的职责变成“用哪些语义”，而不是“用什么颜色”。以后调整灰色，只需要改一处；想给整个站换品牌色，也只改语义层，组件代码完全不动。

## 命名与维护

- 变量名按“类别-用途”的顺序排列，如 `--color-text`、`--color-bg-subtle`；
- 不要在组件里直接写十六进制颜色，否则语义层就失去意义；
- 删除变量前先全局搜索，确认没有残留；
- 给变量加注释，特别是那些看起来一样的灰色。

还有一个排查技巧：开发时临时给所有元素加上 `* { outline: 1px solid red; }`，能快速看清每个元素的边界，再对照间距和边框，找出还没有走变量的地方。

## 什么时候该停

变量不是越多越好。我曾经把每一个字号、每一个边距都抽成变量，结果文件里出现了二十多个没人记得住的名字，维护成本反而上升。后来我删掉了那些只用过一次的变量，只保留会被多处引用的值。

判断标准很简单：这个值会不会在第二个地方出现？会，就抽出来；不会，就先写着。等到它真的重复了再改，成本通常比提前抽象低。

*变量不会让设计变好，但它让设计可以被讨论。*

> 设计系统的价值不在变量本身，而在于它让“改一次”和“改很多次”变成了同一件事。

参考资料：[MDN 的 CSS 自定义属性文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)。
