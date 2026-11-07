除了常规的 Django 用户名与密码认证外，本应用还支持多种集中式账户管理与认证方式。

## 第三方客户端
要借助第三方客户端（例如移动应用）登录，你需要先获取一个会话令牌。

1. 将用户名与密码作为 JSON 请求体 POST 到 https://recipes.your.domain/_allauth/app/v1/auth/login
2. 若登录成功，你将收到如下 JSON 响应。若邮箱尚未确认，或将来加入了 MFA，则可能出现中间步骤。
```json
{
    "status": 200,
    "data": {
        "user": {
            "id": 3,
            "display": "vabene1111",
            "email": "vabene@mail.com",
            "has_usable_password": true,
            "username": "vabene"
        },
        "methods": [
            {
                "method": "password",
                "at": 1792337277.024626,
                "username": "vabene1111"
            }
        ]
    },
    "meta": {
        "is_authenticated": true,
        "session_token": "TOKEN"
    }
} 
```
3. 在向 Tandoor API 发起请求时，将会话令牌用于 `X-Session-Token` 请求头。

如果你想在自己的客户端中使用各种认证功能，请参阅 [Allauth 文档](https://docs.allauth.org/en/latest/)，或查看 Tandoor 的实现以获取示例。

你也可以通过 API 创建 ApiToken，并将其用于后续请求；但更推荐使用会话令牌，因为它允许通过会话管理或修改密码来注销认证。

## Allauth
[Django Allauth](https://docs.allauth.org/en/latest/) 是一个出色的项目，允许你使用[大量](https://docs.allauth.org/en/latest/socialaccount/providers/index.html)不同的认证提供商。

他们的文档基本上解释了所有内容，下面是一个关于如何入门的简要概览。

<!-- prettier-ignore -->
!!! warning "公共提供商"
    如果你选择 Google、Github 或任何其他公开可用的服务作为认证提供商，那么在该站点上拥有账户的任何人都可以在你的安装实例上创建账户。
    新账户没有任何权限，但你仍应考虑是否希望任何人都能使用你的实例。

从[列表](https://docs.allauth.org/en/latest/socialaccount/providers/index.html)中选择一个提供商，并按下例所示使用环境变量 `SOCIAL_PROVIDERS` 安装它。

当至少设置了一个社交提供商后，登录页面上应出现社交登录按钮。
下面的示例启用了 Nextcloud 和通用 OpenID Connect 提供商。

```ini
SOCIAL_PROVIDERS=allauth.socialaccount.providers.openid_connect,allauth.socialaccount.providers.nextcloud
```

!!! warning "格式"
    格式必须精确，因此请务必遵循此处说明的步骤！

### 通过环境变量配置

根据你的认证提供商，你**可能需要**对其进行配置。
这需要通过设置系统完成。为使系统保持灵活（允许多个提供商），并避免额外向容器挂载文件，配置通过单个
环境变量完成。这种方式的缺点是配置必须写成一行，
因为 docker compose 加载的环境文件不支持单个变量跨多行。

该行数据必须采用 JSON 或 Python 字典语法。

从 allauth 文档中取出示例配置，填入你的设置，然后内联整个对象
（你可以使用 [jsoning.com](https://jsoning.com/formatter/) 之类的服务进行格式化）。
将其赋值给额外的 `SOCIALACCOUNT_PROVIDERS` 变量。

下面的示例针对启用了 PKCE 的通用 OIDC 提供商。大多数值都需要根据你的具体情况进行修改！

```ini
SOCIALACCOUNT_PROVIDERS = "{ 'openid_connect': { 'OAUTH_PKCE_ENABLED': True, 'APPS': [ { 'provider_id': 'oidc', 'name': 'My-IDM', 'client_id': 'my_client_id', 'secret': 'my_client_secret', 'settings': { 'server_url': 'https://idm.example.com/oidc/recipes' } } ] } }"
```

由于该 JSON 包含敏感数据（客户端 id 与 secret），你也可以选择将 JSON 保存到文件中，
并将环境变量 `SOCIALACCOUNT_PROVIDERS_FILE` 设为包含该 JSON 的文件路径。

```
SOCIALACCOUNT_PROVIDERS_FILE=/run/secrets/socialaccount_providers.txt
```

!!! success "改进？"
    很可能存在以更干净或更简单的方式实现相同目标的方法。
    如果你知道这样的方法，欢迎告知我。

### 通过 Django 管理后台配置

提供商凭据（客户端 ID、secret、提供商类型）也可以通过 Django 管理后台
配置，而无需使用 `SOCIALACCOUNT_PROVIDERS` 环境变量。其他所有社交登录
设置仍必须以环境变量方式设置。

1. 访问 `/admin/` 并使用超级用户账户登录。
2. 在 **Sites** 下编辑默认站点，使其与你的安装 URL 一致（或创建一个新站点）。
3. 在 **Social accounts → Social applications** 下，根据 [allauth 提供商文档](https://docs.allauth.org/en/latest/socialaccount/providers/index.html)中的所需信息创建一个新应用。
4. 确保将你的站点添加到该应用的可用站点列表中。

!!! warning
    你仍需要在环境中设置 `SOCIAL_PROVIDERS`，以加载 allauth 提供商模块
    （例如 `allauth.socialaccount.providers.openid_connect`）。Django 管理后台仅替代
    `SOCIALACCOUNT_PROVIDERS` 的凭据配置，而不替代提供商模块的注册。

现在提供商已配置完成，你应该能够使用该提供商注册和登录了。
使用超级用户账户为新创建的用户授予权限，或通过 `SOCIAL_DEFAULT_ACCESS` 与 `SOCIAL_DEFAULT_GROUP` 启用默认访问权限（参见[配置文档](../system/configuration.md)）。

### 第三方认证示例

Keycloak 是一款流行的 IAM 解决方案，得益于 Django Allauth，集成过程非常直接。本示例也可作为 Allauth 文档中其他第三方认证解决方案的参考。

在 Keycloak 中创建一个新客户端并分配 `Client-ID`，该客户端会带有一个 `Secret-Key`。这两个值在后续都会用到。确保为该服务定义正确的重定向 URL，例如 `https://tandoor.example.com/*`。根据你的 Keycloak 设置，你可能需要分配角色和用户组以授予对该服务的访问权限。

要将 Keycloak 启用为登录选项，请设置以下变量以定义社交提供商并指定其配置：

```ini
SOCIAL_PROVIDERS=allauth.socialaccount.providers.openid_connect
SOCIALACCOUNT_PROVIDERS='{"openid_connect":{"APPS":[{"provider_id":"keycloak","name":"Keycloak","client_id":"KEYCLOAK_CLIENT_ID","secret":"KEYCLOAK_CLIENT_SECRET","settings":{"server_url":"https://auth.example.org/realms/KEYCLOAK_REALM/.well-known/openid-configuration"}}]}}'
```

重启服务后，你现在就可以使用 Keycloak 登录了。

### 示例：邀请制空间访问的社交登录

要将 Tandoor 设置为以社交登录为主要方式，并通过邀请链接控制空间访问：

```ini
SOCIAL_PROVIDERS=allauth.socialaccount.providers.openid_connect
SOCIALACCOUNT_PROVIDERS=<your provider config>
SOCIALACCOUNT_ONLY=1
SOCIALACCOUNT_EMAIL_AUTHENTICATION=1
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT=1
```

采用此配置后：

1. 登录页面仅显示社交登录按钮（本地登录可通过 `/accounts/login/?form=1` 作为紧急备用方式使用）
2. 点击按钮会直接跳转到提供商（没有确认页面）
3. 新用户通过社交提供商自动创建
4. 如果用户的社交邮箱与现有账户匹配，账户将自动关联
5. 对特定空间的访问通过邀请链接控制 —— 向用户发送邀请链接，
   待他们通过社交提供商完成认证后，即会被加入所邀请的空间

<!-- prettier-ignore -->
!!! note
    任何能通过你的社交提供商完成认证的人都可以创建账户。除非你向他们发送邀请链接或设置 `SOCIAL_DEFAULT_ACCESS=1`，
    否则他们无法访问任何空间。
    若要真正限制谁可以创建账户，请在你的身份提供商处配置访问控制
    （例如在 Authentik/Keycloak 中限制哪些用户或用户组可以访问 Tandoor 应用）。


### 会话管理

用户可以在 `/settings/account/` 查看并管理自己的活动会话。该页面显示所有活动
会话，并允许结束单个会话或所有其他会话（「在所有设备上登出」）。

### 社交登录故障排查

#### 登录失败时的错误详情

当社交登录失败时，错误页面会显示提供商名称、错误代码和
异常详情。如果你需要帮助解决该问题，请将这些详情提供给你的管理员。

常见错误代码：

| 错误代码 | 含义 | 可能原因 |
|------------|---------|--------------|
| `unknown` | 未指明的失败 | 提供商配置错误、网络问题或服务器错误 |
| `cancelled` | 用户取消登录 | 用户在提供商处拒绝授权 |
| `denied` | 访问被拒绝 | 提供商拒绝了请求（客户端 ID/secret 无效、重定向 URI 错误） |

#### 系统页面诊断

管理员可以在 **System** 页面（`/system/`）查看额外的诊断信息：

- **已配置的提供商** —— 列出所有社交登录提供商（来自设置和数据库配置），
  包括其客户端 ID 及已关联账户数量。
- **最近的登录错误** —— 显示最近 50 次社交登录失败（缓存 24 小时），包含时间戳、
  提供商名称、错误代码和异常详情。

#### 常见问题

**「社交网络登录失败」且无详细信息**
:   确保 `SOCIALACCOUNT_PROVIDERS` 格式正确。该值必须是单行上的有效 JSON 或 Python 字典语法。
    请检查引号或方括号是否配对。

**提供商未出现在登录页面上**
:   确认 `SOCIAL_PROVIDERS` 包含正确的 allauth 提供商模块路径
    （例如 `allauth.socialaccount.providers.openid_connect`），且 `SOCIALACCOUNT_PROVIDERS` 包含
    该提供商的有效配置。修改后请重启容器。

**在提供商处登录成功，但返回 Tandoor 时失败**
:   检查在你的提供商处配置的重定向 URI 是否与你的 Tandoor URL 完全一致。
    对于 OpenID Connect 提供商，回调 URL 通常为
    `https://your-tandoor-url/accounts/oidc/login/callback/`（或提供商专用的路径）。
    同时验证 `SOCIALACCOUNT_PROVIDERS` 中的 `client_id` 与 `secret` 是否与提供商配置匹配。

**提供商 userinfo 端点返回 403 Forbidden**
:   提供商拒绝了令牌交换或用户信息请求。请确认客户端凭据
    正确、客户端未在提供商处被禁用，且已授予所需的 scope（通常为 `openid email profile`）。

**用户已创建但没有权限**
:   新的社交登录用户默认没有任何空间访问权限。使用 `SOCIAL_DEFAULT_ACCESS` 与
    `SOCIAL_DEFAULT_GROUP` 环境变量可为新的社交登录用户自动授予权限。

## LDAP

可在 `.env` 文件中通过设置 `LDAP_AUTH=1` 启用 LDAP 认证。
若已设置，LDAP 实例中列出的用户无需注册即可登录。
必须设置以下变量以配置与 LDAP 实例的连接：

```
AUTH_LDAP_SERVER_URI=ldap://ldap.example.org:389
AUTH_LDAP_BIND_DN=uid=admin,ou=users,dc=example,dc=org
AUTH_LDAP_BIND_PASSWORD=adminpassword
AUTH_LDAP_USER_SEARCH_BASE_DN=ou=users,dc=example,dc=org
```

其他可选变量：

```
AUTH_LDAP_USER_SEARCH_FILTER_STR=(uid=%(user)s)
AUTH_LDAP_USER_ATTR_MAP={'first_name': 'givenName', 'last_name': 'sn', 'email': 'mail'}
AUTH_LDAP_ALWAYS_UPDATE_USER=1
AUTH_LDAP_CACHE_TIMEOUT=3600
AUTH_LDAP_START_TLS=1
AUTH_LDAP_TLS_CACERTFILE=/etc/ssl/certs/own-ca.pem
```

## 外部认证

<!-- prettier-ignore -->
!!! warning "安全影响"
    如果你仅设置 `REMOTE_USER_AUTH=1` 而不做任何额外配置，_任何人_ 都可以用 _任意_ 用户名通过认证！

<!-- prettier-ignore -->
!!! Info "社区贡献的教程"
    本教程由社区成员提供。我们无法提供任何支持！请仅在你清楚自己在做什么的情况下使用！

要使用外部认证（即使用 Authelia、Authentik 等代理认证），你需要：

1. 在 `.env` 文件中设置 `REMOTE_USER_AUTH=1`
2. 更新你的 nginx 配置文件

使用上述任一示例都会在 docker 卷内自动生成一个配置文件。
使用 `docker volume inspect recipes_nginx` 可以查明你的卷存储在哪里。

<!-- prettier-ignore -->
!!! warning "配置文件卷"
    nginx 配置卷在容器首次运行时生成。你可以在
    `docker-compose.yml` 中将该卷改为绑定挂载，但那样就需要手动创建它。更多信息请参阅下文
    `Volumes vs Bind Mounts` 一节。

### Authelia 配置示例

```
server {
  listen 80;
  server_name localhost;

  client_max_body_size 16M;

  # serve static files
  location /static/ {
    alias /static/;
  }
  # serve media files
  location /media/ {
    alias /media/;
  }

  # Authelia endpoint for authentication requests
  include /config/nginx/auth.conf;

  # pass requests for dynamic content to gunicorn
  location / {
    proxy_set_header Host $host;
    proxy_pass http://web_recipes:8080;

    # Ensure Authelia is specifically required for this endpoint
    # This line is important as it will return a 401 error if the user doesn't have access
    include /config/nginx/authelia.conf;

    auth_request_set $user $upstream_http_remote_user;
    proxy_set_header REMOTE-USER $user;
  }

  # Required to allow user to logout of authentication from within Recipes
  # Ensure the <auth_endpoint> below is changed to actual the authentication url
  location /accounts/logout/ {
    return 301 http://<auth_endpoint>/logout;
  }
}
```

关于如何设置反向代理、认证和网络，请参阅相应的文档。

确保已为 Authelia 配置好用户，并确保 recipes 所指向的端点已受保护但
仍可访问。

关于需要添加到 nginx 配置中的其他附加文件，[Authelia 文档](https://docs.authelia.com/deployment/supported-proxies/nginx.html)中有一份不错的指南。

记得将相应的环境变量添加到 `.env` 文件（以下是 nginx 代理的示例）：

```
VIRTUAL_HOST=
LETSENCRYPT_HOST=
LETSENCRYPT_EMAIL=
PROXY_HEADER=
```
