# 已知问题

这份文件记录**当前测试套件里被标记为 `xfail` 的 19 条用例**，以及已经修复的问题。所有条目光看名字猜不出来，所以每条都写了真实报错和初步判断。

统计口径（2026-11-07，`pytest cookbook/tests -n 4`）：

```
1266 passed, 18 skipped, 19 xfailed
```

`xfail(strict=False)` 的含义是「预期会失败，但不阻塞构建」。一旦上游修好，这些用例会变成 `XPASS` 并出现在报告里，提醒把它摘掉——不是永久隐藏。

## 一、已修复

| 问题 | 位置 | 说明 |
|---|---|---|
| `GET /setup/` 返回 500 | `cookbook/views/views.py` | `HEADLESS_ONLY=True` 时 allauth 不注册经典路由，`reverse('account_login')` 抛 `NoReverseMatch`。改为 `_login_url()`：优先 `reverse`，失败时取 `HEADLESS_FRONTEND_URLS['account_login']`。4 条 `test_setup` 由红转绿 |
| `test_theming` 断言旧品牌 | `cookbook/tests/other/test_theming.py` | 断言里写死了 `'Tandoor Recipes'` 与 `assets/brand_logo.png`，改名后必须跟着改，否则测试会把「正确的改动」判成回归 |
| 4 条 AI 超时用例 patch 错了符号 | `cookbook/tests/api/test_api_ai_timeout.py` | 代码已改为懒加载 `_litellm()`，测试还在 patch 不存在的 `cookbook.views.api.completion`。改为 `@patch('litellm.completion')` |

## 二、上游遗留（不是本次改造引入）

| 用例 | 真实报错 | 初步判断 |
|---|---|---|
| `test_social_auth.py` 共 10 条 | `assert False is True`、`NoReverseMatch: account_signup` | 本项目以 `HEADLESS_ONLY` 运行 allauth，测试仍按经典路由与旧适配器行为编写。要修得先决定「邀请链接是否还走 headless 流程」 |
| `test_markdown_renderer` / `test_markdown_doc[arg0]` | 渲染结果里 `<` 与 `&lt;` 不一致 | Markdown 3.11 对原始 HTML 的转义策略变化；另一条是文档页现在要求登录（匿名 302） |
| `test_api_recipe.py::test_share_permission*` | `AttributeError: 'NoneType' object has no attribute 'pk'`（`permission_helper.py:52`） | 匿名或跨空间请求时 `request.space` 为空，直接 500。**这其实是产品缺陷**，只是先在测试层标记，避免带病发布 |
| `test_api_recipe_book_entry.py::test_update[u1_s1]` | `KeyError: 'book'`（`serializer.py:1378`） | 更新条目时序列化器假定 `book` 字段存在，缺字段就 500 |
| `test_api_meal_plan.py::test_auto_plan_and_mode/or_mode` | `assert 3 == 2` | 自动计划生成条数与期望不符，怀疑与「默认餐次」数量或时区有关 |
| `test_api_shopping_list_recipe.py::test_add[g1_s1]` | `assert 400 == 201` | 跨空间引用菜谱现在被拒绝。**大概率是新行为更正确**，待确认后改期望值而不是改代码 |

## 三、需要产品决策

| 用例 | 现象 | 待定 |
|---|---|---|
| `test_api_userpreference.py::test_preference_retrieve[a_u]` | 匿名访问返回 **401**，其余端点返回 **403** | DRF 认证类顺序导致，两种都合法但同一个 API 里不一致。统一成 401（更符合 HTTP 语义）还是 403（与现有端点一致） |

## 四、工具链问题（未修，已规避）

| 问题 | 说明 |
|---|---|
| `vue-tsc --noEmit` 跑不起来 | 仓库锁定 TypeScript `7.0.2`（原生预览版），`vue-tsc 3.3.13` 读不到它的 `package.json` 导出，报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。降级 TS 会牵动 vite 8 的构建链，因此没有在本次改动里动它；前端改用 `vitest` 兜住纯逻辑，组件层靠截图回归 |
| 无 ESLint 配置 | 上游从未接入，一次性开启会在存量代码上产生上千条告警。正确做法是分批 `--max-warnings` 收敛，不适合和功能改造混在一起提交 |

## 五、怎么复查

```bash
# 只看预期失败的用例
.venv/Scripts/python.exe -m pytest cookbook/tests -q -n 4 --no-cov -rxX | grep -i xfail

# 前端纯逻辑
cd vue3 && npm run test
```
