## 先确定发布流程

静态博客的部署说简单也简单：把文件放上去就行。但真做过几次就会知道，麻烦的从来不是上传，而是**域名、构建产物和回滚**这三件事。这篇记录我打算同时用 EdgeOne Pages 和 GitHub Pages 的原因和步骤。EdgeOne Pages 现已升级为 EdgeOne Makers，下文沿用旧名。

## 两条路线

GitHub Pages 胜在稳定、免费、和仓库绑定；EdgeOne Pages 的优势是国内的访问速度和更灵活的边缘能力。我的计划是两者都部署：GitHub 作为主站和备份，EdgeOne 作为国内入口。

| 维度 | GitHub Pages | EdgeOne Pages |
| --- | --- | --- |
| 部署方式 | Actions（本仓库使用） | 关联 Git 仓库后自动构建 |
| 国内访问 | 一般 | 通常更快 |
| 自定义域名 | 支持 | 支持 |
| 适合场景 | 项目文档、备用站 | 面向国内读者的主站 |

> 表格里写的是自己的体验，不是官方性能结论。访问速度受运营商和时段影响很大，部署前最好自己实测。

## GitHub Pages 的步骤

1. 在仓库的 Settings → Pages → Build and deployment 里，把 Source 选为 **GitHub Actions**；
2. 推送 `main`，或在 Actions 页手动 Run workflow；
3. 等待工作流完成，访问 `https://<用户名>.github.io/<仓库名>/`。

仓库根目录的 `.nojekyll` 仍然保留，用于关闭 Jekyll 处理。早期也可以用分支发布，但本项目统一用 Actions，推送后由工作流上传产物。

核心步骤（完整版见仓库里的 `.github/workflows/deploy-pages.yml`）：

```yaml
name: deploy-pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - uses: actions/deploy-pages@v5
```

注意 `permissions` 这几行不能省，否则部署步骤会因为权限不足失败。

## EdgeOne Pages 的步骤

EdgeOne Pages（现 EdgeOne Makers）的流程更接近常见的静态托管平台：授权 Git 仓库、选择分支、填写构建命令和输出目录。我的站点没有构建步骤，所以构建命令留空，输出目录填仓库根目录。

这里有一个容易被忽略的点：**“没有构建步骤”也是一种构建配置**。如果以后我加了预处理器，输出目录就不再是根目录，而是生成后的 `dist`。所以我会在部署说明里写清楚当前的输出目录，避免半年后的自己改错。

## 域名与 HTTPS

自定义域名要在两处同时配置：托管平台的域名设置，以及 DNS 里的 CNAME 记录。两边的值必须一致，否则会出现“控制台显示已绑定，但访问仍然 404”的情况。

GitHub Pages 在仓库设置里绑定域名后，证书签发需要等一段时间；EdgeOne 则要在控制台完成域名接入和证书配置。HTTPS 没生效前，不要急着宣传新域名。

## 两个站点如何同步

接入之后，让两个平台都关联同一个仓库，`push` 一次就会各自触发构建。发布后我会做两件事：

- 确认两个站点的文章列表来自同一个 commit；
- 在本地用 `git log -1 --oneline` 核对版本。

如果只想更新其中一个平台，也可以手动触发构建，但我不建议长期这样。两个站点内容不一致，比没有备用站更麻烦。

## 发布前检查清单

- 本地起一个服务确认没有 404：`python -m http.server 8000`；
- 检查文章列表和详情页的链接；
- 确认 `.gitignore` 没有误排除 `content/`；
- 对比两个站点的页面是否一致。

```bash
git status
git add -A
git commit -m "deploy: update posts"
git push origin main
```

## 关于回滚

CI 部署最怕“部署成功，站点坏了”。我的习惯是给每次发布打 tag，出问题直接回到上一个 tag 重新部署。静态站没有数据库迁移，回滚成本很低，但前提是你真的留下了一个可回到的点。

*发布流程应该像提交代码一样：可重复，可回滚。*

参考：[GitHub Pages 官方文档](https://docs.github.com/zh/pages)、[EdgeOne Pages](https://pages.edgeone.ai/)。
