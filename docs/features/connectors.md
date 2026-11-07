<!-- prettier-ignore -->
!!! warning
    连接器目前处于 beta 阶段。

## 连接器

连接器是 TandoorRecipes 的强大附加组件。
它们允许将某些操作转换为对外部服务的 api 调用。

<!-- prettier-ignore -->
!!! danger
    为了让本应用能够向外部提供商推送数据，它需要存储认证信息。
    请尽可能使用只读/独立账户或应用密码。

有关配置请参阅 [配置](https://docs.tandoor.dev/system/configuration/#connectors)

## 当前连接器

### HomeAssistant

当前的 HomeAssistant 连接器支持以下功能：
1. 推送新建的购物清单条目。
2. 如果菜谱被添加到购物清单，则推送所有购物清单条目。
3. 如果 HomeAssistant 中的待办事项未被改动且是通过 TandoorRecipes 移除的，则将其移除。

#### 如何配置：

第 1 步：
1. 生成一个 HomeAssistant 长期访问令牌
![个人资料页面](https://github.com/TandoorRecipes/recipes/assets/7824786/15ebeec5-5be3-48db-97d1-c698405db533)
2. 获取/创建一个你希望同步到的待办清单条目。
![待办事项视图](https://github.com/TandoorRecipes/recipes/assets/7824786/506c4c34-3d40-48ae-a80c-e50374c5c618)
3. 创建一个 Home Assistant 连接器并填写必填字段：

- **URL：** 输入你的 Home Assistant URL，**包含 `/api` 后缀**。
  示例：
  ```
  http://homeassistant.local:8123/api
  ```
  或
  ```
  https://homeassistant.example.com/api
  ```

- **访问令牌：** 粘贴第 1 步中创建的长期访问令牌。

- **待办清单名称：** 输入完整的 Home Assistant 待办实体 ID（例如 `todo.shopping`），而不仅仅是显示名称（`shopping`）。

![新建连接器配置](...)
!!! note
    较新版本的 Home Assistant 连接器界面不再明确提及要在 URL 中添加 `/api`。请确保 URL 包含 `/api`，否则连接器将无法工作。

    **待办清单名称**字段需要完整的实体 ID（例如 `todo.shopping`），而不是仅填写清单名称。
4. ???
5. 盈利
