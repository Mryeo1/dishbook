# 改动记录

本文件是 [NOTICE.md](../NOTICE.md) 要求的「修改说明」，按主题列出相对上游 Tandoor Recipes 的改动，以及每一处的入口文件。提交历史按同样的主题拆分，`git log --oneline` 可以逐条对应。

## 一、界面中文化

| 内容 | 文件 |
|---|---|
| 1121 个界面文案译为简体中文，新增 `AppName`、`Home`、`NothingPlannedHint` 等键 | `vue3/src/locales/zh_Hans.json` |
| 品牌词在英文包里替换为 Dishbook，并补上被漏掉的基础单位键 | `vue3/src/locales/en.json` |
| 默认语言改为「先看用户显式选择，再退回 `LANGUAGE_CODE`」，不再跟随 `Accept-Language` | `cookbook/helper/locale_default.py`、`recipes/settings.py` |
| 帮助文档首页汉化 | `docs/index.md` |

背景：上游用 `django.middleware.locale.LocaleMiddleware`，在没有 cookie 时会读浏览器语言。中文用户从终端点开链接（浏览器声明 `en-US`）会进到英文界面，而手动粘贴的浏览器因为存过 `django_language` cookie 反而是中文。现在只有用户主动切换过语言才跟随选择。

## 二、品牌更名

| 内容 | 文件 |
|---|---|
| 字标组件：图标 + 真实文本，换名只改语言包 | `vue3/src/components/display/BrandWordmark.vue` |
| 顶栏、登录页品牌区、浏览器标题改用组件与 `$t('AppName')` | `apps/tandoor/Tandoor.vue`、`components/account/AuthLayout.vue` |
| 后端默认应用名与导航图标 | `cookbook/templatetags/theming_tags.py` |
| API 文档标题、邮件主题前缀、邀请邮件文案 | `recipes/settings.py`、`cookbook/serializer.py` |
| 系统页与基础模板 | `cookbook/templates/system.html`、`cookbook/templates/base.html` |
| 主题选项改为「食单 浅色 / 食单 深色」 | `vue3/src/components/settings/CosmeticSettings.vue` |

上游的 `brand_logo.svg` 里 "Tandoor" 是矢量字形而非文本，无法直接改字，因此拆成「图片图标 + 文本」。

**未改动**：GitHub 链接、「从 Tandoor 导入」功能名（指上游真实产品）、`recipes/` 与 `apps/tandoor/` 等包名目录名。

## 三、会话有效期

| 内容 | 文件 |
|---|---|
| 登录时记录起点；超过 `SESSION_MAX_AGE` 后强制登出，API 返回 401 | `cookbook/helper/session_limits.py` |
| 空闲 5 分钟过期（`SESSION_IDLE_TIMEOUT`）+ 绝对上限 3 小时（`SESSION_MAX_AGE`） | `recipes/settings.py`、`.env.template` |
| 60 秒心跳续期、20 秒检查上限、用响应头 `X-Session-Max-Age-Remaining` 校正倒计时 | `vue3/src/utils/sessionGuard.ts` |
| 到期弹窗（不可关闭，只能重新登录） | `vue3/src/components/dialogs/SessionMaxAgeDialog.vue` |
| 401/403 统一处理，登录页一次性提示票据（刷新后不再重复出现） | `vue3/src/utils/sessionWatcher.ts`、`utils/sessionStorage.ts`、`pages/account/LoginPage.vue` |

## 四、用餐计划日历

| 内容 | 文件 |
|---|---|
| 行高由当天条目数反推，条目不再溢出到下一周 | `vue3/src/components/display/MealPlanView.vue` |
| 条目拆成「定位壳 + 卡片」，条目间有真实间距 | `components/display/MealPlanCalendarItem.vue` |
| 空白格显示「＋ 添加」占位；周数改为窄轨 | 同上 |
| 整屏无安排时浮出「暂无安排 / 点任意日期添加」，并收起逐格的「＋」（21 个一样的提示只会互相打架） | `MealPlanView.vue`、`utils/mealplanLayout.ts` |
| 修复每月 1 号的月份标签：被挤进 28px 列宽后一字一行，还带着上游的粉色底 | `MealPlanView.vue`、`apps/tandoor/Tandoor.vue` |
| 工具条改为「‹ 今天 › + 日历图标」 | `components/display/MealPlanCalendarHeader.vue` |
| 手机端改为按天议程 | `components/display/MealPlanAgenda.vue` |
| 首页两天窗口 + 「查看整周」弹窗 | `components/display/HorizontalMealPlanWindow.vue` |

## 五、工程化

| 内容 | 文件 |
|---|---|
| 日历几何抽成纯函数：`visibleRange` / `slotsPerRow` / `computeMetrics` / `rowHeight` / `hasEntriesInRange` | `vue3/src/utils/mealplanLayout.ts` |
| 22 个单测覆盖跨周条目、槽位上下限、行高不溢出、深色紧凑布局、空区间判定 | `vue3/src/utils/__tests__/mealplanLayout.spec.ts` |
| `npm run test` / `test:watch` | `vue3/package.json` |
| 深色模式 token 化（`--mp-*`，浅色 + 深色两套） | `MealPlanView.vue`、`MealPlanCalendarItem.vue`、`MealPlanCalendarHeader.vue` |
| 修复 `GET /setup/` 500（headless 模式下 `reverse('account_login')` 不存在） | `cookbook/views/views.py`、`recipes/settings.py` |
| 4 条 AI 超时用例 patch 到正确的符号 | `cookbook/tests/api/test_api_ai_timeout.py` |
| 主题测试断言更新为新品牌 | `cookbook/tests/other/test_theming.py` |
| 19 条上游遗留失败改为带原因的 `xfail`，逐条记录 | `docs/KNOWN_ISSUES.md` |
| 构建/同步/灌数据/截图/校验脚本从临时目录迁到 `scripts/` | `scripts/` |
| 修复同步脚本：刷新被 `ManifestStaticFilesStorage` 冻结的 `manifest.<hash>.json` | `scripts/sync_static.py` |

## 六、顶栏配色

| 内容 | 文件 |
|---|---|
| 顶栏由金色改为中性：浅色白底、深色 `#212121`，强调色只保留在 `primary`（按钮、链接） | `vue3/src/vuetify.ts` |
| 品牌名跟随顶栏表面色，不再用强调色——白底上的棕金色看着像链接 | `apps/tandoor/Tandoor.vue` |
| 顶栏底部加 1px 分隔线，浅色 `rgba(0,0,0,.07)` / 深色 `rgba(255,255,255,.09)` | 同上 |
| `UserPreference.nav_bg_color` 默认值改为空字符串，空值表示跟随主题 | `cookbook/models.py` |
| 数据迁移只清掉仍等于旧默认值 `#ddbf86` 的行，用户自选的颜色不动 | `cookbook/migrations/0244_neutral_nav_color_default.py` |
| 两处取色器色板改为中性五色 | `CosmeticSettings.vue`、`SpaceEditor.vue` |

金色原本来自 `UserPreference.nav_bg_color` 的默认值 `#ddbf86`，不是主题里的写死值——所以只改主题不生效，必须连默认值和已有数据一起处理。

## 七、文档本地化

| 内容 | 文件 |
|---|---|
| 40 篇上游 Markdown 译为简体中文，文件名与目录结构保持不变 | `docs/index.md`、`docs/faq.md`、`docs/{features,install,system,contribute}/**` |
| 6 个被跨文档引用的标题用 `{#id}` 固定英文锚点，避免翻译后链接失效 | `install/docker.md`、`install/manual.md`、`system/configuration.md` |
| 修正 2 处上游本来就悬空的锚点，改指向实际存在的 `#allauth` 小节 | `system/configuration.md` |
| 文档站导航、站点名、仓库地址汉化 | `mkdocs.yml` |
| `attr_list` 扩展（`{#id}` 语法依赖它） | `mkdocs.yml` |

译文保留代码块、命令、配置键、环境变量与专有名词原文。验收方式是逐文件对比提交前后的代码围栏数、标题数、表格行数、链接数与 admonition 数——40 个文件全部一致，没有段落被吞。

## 八、交付文档

| 内容 | 文件 |
|---|---|
| 使用手册（单文件 HTML，9 张实拍截图内嵌，可离线分发与打印） | `docs/食单使用手册.html` |
| 已知问题清单（19 条 xfail 的真实报错与判断） | `docs/KNOWN_ISSUES.md` |
| 项目说明与运行方式 | `README.md`、`NOTICE.md` |

## 九、可复现性（让陌生人能在十分钟内跑起来）

| 内容 | 文件 |
|---|---|
| 新增开发用 env 模板：SQLite、`DEBUG=1`、随机 `SECRET_KEY` 由脚本生成 | `.env.example` |
| `setup_demo.sh` 改为复制 `.env.example`（不再用面向部署的 `.env.template`），缺前端依赖时自动 `npm ci`，缺 Python 依赖时一句话报错而不是中途崩 | `scripts/setup_demo.sh` |
| 新增真正会执行的 CI：语言包校验、pytest、vitest、`vite build` | `.github/workflows/ci-dishbook.yml` |
| 删除上游传入的 4 个 workflow（`ci` / `build-docker` / `codeql-analysis` / `docs`）——它们全带 `if: github.repository_owner == 'TandoorRecipes'`，在派生仓库里每次运行都是 `skipped`，留着只会让人以为有 CI | `.github/workflows/`（删除 4 个） |
| 移除上游传入的 `dependabot.yml`，并停用随之而来的自动 PR 分支 | `.github/dependabot.yml`（删除） |
| 前端依赖统一到 npm：删除与 `package-lock.json` 并存的 `yarn.lock` | `vue3/yarn.lock`（删除） |

两点需要说明：

1. **上游的 4 个 workflow 全部带 `if: github.repository_owner == 'TandoorRecipes'`**，在这个仓库里每次运行都是 `skipped`，等于没有 CI。修它们没有意义（守卫仍在），所以直接删掉，另写一个不带守卫、只跑本项目关心的三件事的 workflow。
2. **基线导入不完整。** 最初的 `chore: 导入 Tandoor Recipes 代码基线` 漏掉了 `cookbook/tests/`、`cookbook/serializer.py` 等上游文件，于是这些文件首次出现在后续的功能提交里（例如品牌改名那个提交里躺着 2270 行的 serializer）。仓库当前内容完整，但用 `git log --stat` 看单个提交时会看到不属于该主题的代码。这是导入时的操作失误，事后已在此说明，没有重建历史。

## 十、仓库卫生：把「别人的东西」清出去

派生仓库最容易露怯的不是代码，而是没清的残留：别人的捐赠按钮、别人的议题模板、指回别人文档站的链接。这一轮逐项清理，原则是**清掉失效与误导，保留署名与出处**。

| 处理 | 对象 |
|---|---|
| 删除 `FUNDING.yml`——把捐赠导向上游作者，在别人部署的实例里没有意义 | `.github/FUNDING.yml` |
| 删除议题模板 11 个文件（含 4 个 `.bak` 残留），其中 `config.yml` 把 FAQ 指向上游站点 | `.github/ISSUE_TEMPLATE/` |
| 删掉上游宣传图（金色顶栏、英文界面、品牌名仍是 Tandoor），首页改用本仓库真实截图 | `docs/preview.png` |
| 文档首页重写：去掉 star / fork / discord / docker-pulls / demo 徽章，换成本仓库 CI 徽章；logo 本地化 | `docs/index.md`、`docs/assets/logo.png` |
| 应用内帮助页：网站 / GitHub / 参与贡献 / 翻译四个入口改指本仓库，删除「赞助」按钮 | `vue3/src/components/display/HelpView.vue` |
| 后台列表页的「?」帮助链接 9 处改指本仓库对应章节 | `cookbook/templatetags/custom_tags.py` |
| 404 页「报告问题」、Markdown 语法示例、系统页升级链接改指本仓库 | `cookbook/templates/{404,markdown_info,system}.html` |
| 文档里 11 处 `docs.tandoor.dev` 链接改为站内相对链接；顺带修好 2 处上游本来就坏的链接（`traefik.md` 不存在、kubesail 页的链接嵌套写法） | `docs/**` |
| Docker 安装页顶部加范围声明：本分支未发布镜像，照此部署得到的是上游版本 | `docs/install/docker.md` |
| `.env.template` 注释与 devcontainer 名称里的上游痕迹 | `.env.template`、`.devcontainer/devcontainer.json` |

**保留不动的部分**：`LICENSE.md`、`NOTICE.md`、`CONTRIBUTERS.md`（上游贡献者名单，已加说明）、`docs/index.md` 的「关于本页」、系统页与导出文件里的上游署名，以及文档中引用具体上游 issue 编号的历史链接。这些是 GPLv3 与 Commons Clause 要求的出处标注，也是这个项目诚实的一部分——**删掉它们不是「去痕迹」，是换一个更严重的问题。**
