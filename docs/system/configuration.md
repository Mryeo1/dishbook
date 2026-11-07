本页介绍应用服务器的所有配置选项。所有设置都必须在应用服务器的环境中配置，
通常的做法是把它们添加到 `.env` 文件中。

## 必需设置

以下设置需要根据你的安装情况进行适当配置。它们已包含在默认的 `env.template` 中。

### 密钥

随机密钥（至少 50 个字符），可使用例如 `base64 /dev/urandom | head -c50` 生成一个。它由 django 内部用于各种签名/加密操作，**应当保密**。
参见 [Django 文档](https://docs.djangoproject.com/en/5.0/ref/settings/#std-setting-SECRET_KEY)

```
SECRET_KEY=#$tp%v6*(*ba01wcz(ip(i5vfz8z$f%qdio&q@anr1#$=%(m4c
```

或者，你可以指向一个仅包含密钥值的文件。如果使用容器，请确保该文件是持久的，
并且在容器内可访问。

```
SECRET_KEY_FILE=/path/to/file.txt

// contents of file
#$tp%v6*(*ba01wcz(ip(i5vfz8z$f%qdio&q@anr1#$=%(m4c
```

#### 允许的主机

> default `*` - options: `recipes.mydomain.com,cooking.mydomain.com,...`（以逗号分隔的域名/IP 列表）

用于防止 HTTP Host 头攻击的安全设置，
参见 [Django 文档](https://docs.djangoproject.com/en/5.0/ref/settings/#allowed-hosts)。
某些代理需要设为 `*`（默认值），但应当将其设置为实际的主机名。

```
ALLOWED_HOSTS=recipes.mydomain.com
```

### 数据库

配置数据库需要多个参数。
*注意：你可以通过在前面加上 `TEST_` 来定义所有参数，从而配置测试数据库，例如 TEST_DB_ENGINE=*

| 变量              | 选项                                                                             | 描述                                                                    |
|-------------------|----------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| DB_ENGINE         | django.db.backends.postgresql（推荐）django.db.backends.sqlite3（默认）          | 数据库连接的类型。生产环境应始终使用 postgresql。                       |
| POSTGRES_HOST     | 任意                                                                             | 用于连接数据库服务器。在 docker 部署中使用容器名称。                    |
| POSTGRES_DB       | 任意                                                                             | 数据库的名称。                                                          |
| POSTGRES_PORT     | 1-65535                                                                          | 数据库端口，Postgresql 默认为 `5432`                                    |
| POSTGRES_USER     | 任意                                                                             | 数据库连接的用户名。                                                    |
| POSTGRES_PASSWORD | 任意                                                                             | 数据库连接的密码。                                                      |

#### 密码文件

> default `None` - options: 文件路径

包含数据库密码的文件的路径。会覆盖 `POSTGRES_PASSWORD`。仅在使用 Docker（或其他
运行 `boot.sh` 的部署方式）时生效。

```
POSTGRES_PASSWORD_FILE=
```

#### 连接字符串

> default `None` - options: 依据数据库规范

除了使用多个独立的环境参数来配置连接之外，你还可以使用连接字符串。
连接字符串会覆盖所有其他数据库设置。

```
DATABASE_URL = engine://username:password@host:port/dbname
```

#### 连接选项

> default `{}` - options: 依据数据库规范

可以按照下面的示例设置额外的连接选项。

```
DB_OPTIONS={"sslmode":"require"}
```

## 可选设置

所有可选设置，顾名思义，都是可选的，可以放心忽略。如果你想进一步了解它们能做什么，可以浏览本页内容。建议按分类阅读以作引导。

### 服务器配置

与提供相关服务有关的配置选项。

#### 端口

> default `80` - options: `1-65535`

!!! warning
    从 2.3 版本起，不再配置 gunicorn 的端口，而是配置内部 nginx 的端口

Tandoor 对外暴露其内部 Web 服务器的端口。

```
TANDOOR_PORT=80
```


#### URL 路径

> default `None` - options: `/custom/url/base/path`

如果基础 URL 不是单纯的 /（例如你在代理中提供的是子目录
http://recipe_app/recipes/）
注意不要带结尾斜杠：例如用 '/recipes' 而不是 '/recipes/'

```
SCRIPT_NAME=/recipes
```

#### 静态 URL

> default `/static/` - options: `/any/url/path/`, `https://any.domain.name/and/url/path`

如果静态文件存储或提供于其他位置，请取消注释并相应修改。
它既可以是相对于应用基础路径的相对路径，也可以是外部主机的 URL。

!!! info
    - 必须以 `/` 结尾
    - 如果你只是使用子目录，则无需设置此项

```
STATIC_URL=/static/
```

#### 静态根目录

> default `<basedir>/staticfiles` - options `/some/other/media/path`。

静态文件应存储在磁盘上的位置。默认位置是
应用目录根部的 `staticfiles` 子目录。

#### 媒体 URL

> default `/static/` - options: `/any/url/path/`, `https://any.domain.name/and/url/path`

如果媒体文件存储于其他位置，请取消注释并相应修改。
它既可以是相对于应用基础路径的相对路径，也可以是外部主机的 URL

!!! info
    - 必须以 `/` 结尾
    - 如果你只是使用子目录，则**无需设置**此项
    - 如果使用 S3/对象存储，则**无需设置**此项

```
MEDIA_URL=/media/
```

#### 媒体根目录

> default `<basedir>/mediafiles` - options `/some/other/media/path`。

媒体文件应存储在磁盘上的位置。默认位置是
应用目录根部的 `mediafiles` 子目录。

#### 本地存储路径

> default `<MEDIA_ROOT>/local_provider` - options: `/path/to/local/recipes,/another/path`（以逗号分隔的列表）

本地提供程序（local provider）允许的路径。本地提供程序只会提供位于这些路径之内的文件。

```
LOCAL_STORAGE_PATHS=/path/to/local/recipes
```

#### Gunicorn 工作进程数

> default `3` - options `1-X`

设置使用 `boot.sh` 启动时要启动的 gunicorn 工作进程数量（所有容器安装方式）。
默认值对大多数安装环境来说可能都是合适的。
推荐设置参见 [Gunicorn 文档](https://docs.gunicorn.org/en/stable/design.html#how-many-workers)。

```
GUNICORN_WORKERS=3
```

#### Gunicorn 线程数

> default `2` - options `1-X`

设置使用 `boot.sh` 启动时要启动的 gunicorn 线程数量（所有容器安装方式）。
默认值对大多数安装环境来说可能都是合适的。
推荐设置参见 [Gunicorn 文档](https://docs.gunicorn.org/en/stable/design.html#how-many-workers)。

```
GUNICORN_THREADS=2
```


#### Gunicorn 超时

> default `30` - options `1-X`

设置使用 `boot.sh` 启动时 gunicorn 的超时时间（单位：秒）（所有容器安装方式）。
默认值对大多数安装环境来说可能都是合适的。不过，如果你使用的 LLM 响应时间较长，gunicorn 可能会在等待 LLM 完成的过程中超时，这种情况下你可能需要增大超时时间。
默认设置参见 [Gunicorn 文档](https://docs.gunicorn.org/en/stable/settings.html#timeout)。

```
GUNICORN_TIMEOUT=30
```

#### Gunicorn 媒体文件

> default `0` - options `0`, `1`

直接使用 gunicorn 提供媒体文件。基本上所有人都建议不要这样做。请使用所提供的任一示例，其中包含一个额外的 nginx 容器来处理媒体文件的提供。
如果你清楚自己在做什么，可以将其启用（`1`），从而使用 django 的 serve() 方法来提供媒体文件。

```
GUNICORN_MEDIA=0
```

#### CSRF 受信来源

> default `[]` - options: [list,of,trusted,origins]

允许设置来源（origin），以接受非安全请求。
参见 [Django 文档](https://docs.djangoproject.com/en/5.0/ref/settings/#csrf-trusted-origins)

```
CSRF_TRUSTED_ORIGINS = []
```

#### CORS 来源

> default `False` - options: `False`, `True`

默认情况下，跨源资源共享是禁用的。启用后将允许其他域访问你的资源。
启用之前请仔细阅读[相关文档](https://github.com/adamchainz/django-cors-headers)。

```
CORS_ALLOW_ALL_ORIGINS = True
```

#### 会话 Cookie

Django 会话 cookie 设置。可以修改它以允许单个 django 应用在同一数据库下运行时为多个应用进行认证。

```
SESSION_COOKIE_DOMAIN=.example.com
SESSION_COOKIE_NAME=sessionid # use this only to not interfere with non unified django applications under the same top level domain
```

### 功能

有些功能可以在服务器级别启用/禁用，因为它们可能会显著改变用户体验，可能不稳定/处于测试阶段，或者会带来性能/安全方面的影响。

#### 验证码

如果你允许用户注册你的实例，可能希望使用验证码来防止垃圾信息。
Tandoor 支持 HCAPTCHA，它被认为是一个注重隐私的验证码提供方。
更多信息以及获取 sitekey 和 secret 请参见 [HCAPTCHA 网站](https://www.hcaptcha.com/)。

```
HCAPTCHA_SITEKEY=
HCAPTCHA_SECRET=
```

#### 指标

启用后在 `/metrics` 路径下提供 prometheus 指标

!!! danger
    该视图并未做安全防护（按 prometheus 的默认方式），因此请务必通过你的 Web 服务器对其进行保护。

```
ENABLE_METRICS=0
```

#### 树排序

> default `0` - options `0`, `1`

默认情况下 SORT_TREE_BY_NAME 是禁用的，此时所有关键词和食物都按其创建顺序存储。
启用此设置会使保存新的关键词和食物变得非常慢，在大多数使用场景下这并无影响。
但是，在进行会创建新对象的大型菜谱导入时，总运行时间可能增加 10-15 倍
关键词和食物可以在管理后台中按名称手动排序
该值也可以在管理后台中临时修改，应用下次启动时会恢复

!!! info
    禁用树排序只是一个临时方案，未来我们可能会找到更好的实现，使得在启用树排序的同时不产生巨大的性能影响。

```
SORT_TREE_BY_NAME=0
```

#### PDF 导出

> **已移除。** 基于 pyppeteer 的 PDF 导出已被移除。请使用浏览器的打印功能（Ctrl+P）将菜谱保存为 PDF。

<!--
ENABLE_PDF_EXPORT=1
-->

#### 法律 URL

根据你所在司法辖区的要求，你可能需要为你的实例提供以下任一 URL。

```
TERMS_URL=
PRIVACY_URL=
IMPRINT_URL=
```

#### 速率限制

有一些速率限制可以进行配置。

- RATELIMIT_URL_IMPORT_REQUESTS：限制外部 URL 导入请求的数量。有助于防止你的服务器被滥用于恶意请求。

### 认证

所有与认证有关的可配置变量。
你可以在[专门的文档页面](https://docs.tandoor.dev/features/authentication/)上找到一些示例。

#### 默认权限

> default `0`（禁用） - options `0`, `1`

启用后，新的社交登录用户将自动加入第一个已存在的、其组为 `SOCIAL_DEFAULT_GROUP` 中所配置的组的空间。

!!! danger
    在启用公开注册的情况下，这将使每个人都能访问该空间中的数据。你可能只应在使用受信认证系统时才使用此选项。

```
SOCIAL_DEFAULT_ACCESS = 1
```

> default `guest` - options `guest`, `user`, `admin`

```
SOCIAL_DEFAULT_GROUP=guest
```

#### 启用注册

> default `0` - options `0`, `1`

允许创建账户，包括本地账户（用户名/密码）以及通过第三方提供方创建的社交账户。


```
ENABLE_SIGNUP=0
```

#### 社交认证

允许你设置外部认证提供方。详细配置指南参见[认证功能文档](../features/authentication.md)。

```
SOCIAL_PROVIDERS=allauth.socialaccount.providers.openid_connect
SOCIALACCOUNT_PROVIDERS='{"openid_connect":{"APPS":[{"provider_id":"myidp","name":"My Provider","client_id":"...","secret":"...","settings":{"server_url":"https://idp.example.com/.well-known/openid-configuration"}}]}}'
```

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `SOCIALACCOUNT_PROVIDERS` | — | 提供方配置（JSON 或 Python 字典） |
| `SOCIALACCOUNT_PROVIDERS_FILE` | — | 包含提供方配置的文件路径 |
| `SOCIALACCOUNT_ONLY` | `0` | 完全禁用用户名/密码认证（[详情](../features/authentication.md#allauth)） |
| `SOCIALACCOUNT_EMAIL_AUTHENTICATION` | `0` | 按邮箱将社交登录匹配到已有账户（[详情](../features/authentication.md#allauth)） |
| `SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT` | `0` | 匹配时跳过邮箱验证（[详情](../features/authentication.md#allauth)） |

#### 受信代理数量 {#trusted-proxy-count}

> default `1`

Tandoor 对登录、注册和密码重置使用基于 IP 的限流，以防止暴力破解攻击。
由于 Tandoor 内置的 nginx 通过 unix socket 代理到应用服务器，应用无法直接看到客户端 IP 地址，必须从 `X-Forwarded-For` 头中读取。

此设置告诉 Tandoor 在客户端与应用服务器之间有多少个反向代理。
默认值 `1` 考虑了 Tandoor 内置的 nginx，适用于大多数部署。如果你还运行了额外的反向代理，请增大此值以匹配你的代理总数，从而使限流使用真实的客户端 IP 而不是代理 IP。

| 部署方式 | 数值 |
| :--- | :--- |
| 直接访问（无外部代理） | `1` |
| 一个外部反向代理 | `2` |
| 两个外部反向代理（例如 CDN + 本地代理） | `3` |

```
ALLAUTH_TRUSTED_PROXY_COUNT=1
```

#### 远程用户认证
> default `0` - options `0`, `1`

允许通过 REMOTE-USER 头进行认证（例如可用于 authelia）。

!!! danger
    如果你不清楚自己在做什么，请勿启用！在没有正确配置的情况下启用此项，将使任何人都能以任意用户名登录！

```
REMOTE_USER_AUTH=0
```

#### LDAP

基于 LDAP 的认证默认是禁用的。你可以将 `LDAP_AUTH` 设为 `1` 并相应配置其他设置来启用它。请删除/注释掉你的部署中不需要的设置。

```
LDAP_AUTH=
AUTH_LDAP_SERVER_URI=
AUTH_LDAP_BIND_DN=
AUTH_LDAP_BIND_PASSWORD=
AUTH_LDAP_USER_SEARCH_BASE_DN=
AUTH_LDAP_TLS_CACERTFILE=
AUTH_LDAP_START_TLS=
```

除了直接通过环境变量 `AUTH_LDAP_BIND_PASSWORD` 传递 LDAP 密码之外，你还可以把密码写入文件，并将环境变量 `AUTH_LDAP_BIND_PASSWORD_FILE` 设置为包含该 ldap 密钥的文件的路径。

```
AUTH_LDAP_BIND_PASSWORD_FILE=/run/secrets/ldap_password.txt
```

### 外部服务

#### 邮件

邮件设置，更多信息参见 [Django 文档](https://docs.djangoproject.com/en/3.2/ref/settings/#email-host)。
邮箱确认和密码重置需要此项（设置主机后会自动激活）。

```
EMAIL_HOST=
EMAIL_PORT=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=0
EMAIL_USE_SSL=0
# email sender address (default 'webmaster@localhost')
DEFAULT_FROM_EMAIL=
```

除了直接通过环境变量 `EMAIL_HOST_PASSWORD` 传递邮箱密码之外，你还可以把密码写入文件，并将环境变量 `EMAIL_HOST_PASSWORD_FILE` 设置为包含该 ldap 密钥的文件的路径。

```
EMAIL_HOST_PASSWORD_FILE=/run/secrets/email_password.txt
```

可选设置（只复制你需要的部分）

```
# prefix used for account related emails (default "[Tandoor Recipes] ")
ACCOUNT_EMAIL_SUBJECT_PREFIX=
```

#### S3 对象存储

如果你想使用支持 S3 API 的外部存储提供方（例如 S3、MinIO……）来存储用户的媒体文件，请相应配置以下设置。
只要 `S3_ACCESS_KEY` 未设置，所有与对象存储相关的设置都是禁用的。

更多信息另见 [Django Storages 文档](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)。

!!! info
    这些设置虽然名为 S3，但适用于所有兼容的对象存储提供方。

必需设置

```
S3_ACCESS_KEY=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

或者，你可以指向一个包含 S3_SECRET_ACCESS_KEY 值的文件。如果使用容器，请确保该文件是持久的并且在容器内可访问。

```
S3_SECRET_ACCESS_KEY_FILE=/path/to/file.txt
```

可选设置（只复制你需要的部分）

```
S3_REGION_NAME= # default none, set your region might be required
S3_QUERYSTRING_AUTH=1 # default true, set to 0 to serve media from a public bucket without signed urls
S3_QUERYSTRING_EXPIRE=3600 # number of seconds querystring are valid for
S3_ENDPOINT_URL= # when using a custom endpoint like minio
S3_CUSTOM_DOMAIN= # when using a CDN/proxy to S3 (see https://github.com/TandoorRecipes/recipes/issues/1943)
```

#### AI 集成

大多数 AI 功能通过 Tandoor Web 界面中的 AI 提供方设置进行配置。你可以为实例上的新空间设置一些默认值。

默认为空间启用 AI 功能
```
SPACE_AI_ENABLED=1
```

设置 AI 使用的每月默认额度上限
```
SPACE_AI_CREDITS_MONTHLY=100
```

AI API 的限流
```
AI_RATELIMIT=60/hour
```

如果你想使用自己的 AI 提供方/AI 服务器/AI 代理，需要通过以下设置配置允许的远程端点。
这可以防止恶意用户提供可能导致 SSRF 攻击的恶意端点。
> default `[]`
```
AI_ALLOWED_URLS=https://my-ai-server.com/api/v1/,https://my-ai-proxy.com/api/v1/
```

#### FDC Api

FDC Api 用于从 [FDC 营养数据库](https://fdc.nal.usda.gov/fdc-app.html#/)自动加载营养信息。
默认的 `DEMO_KEY` 限制为每小时 30 次请求或每天 50 次请求。
如果你想对 FDC API 发起大量请求，需要[在此](https://fdc.nal.usda.gov/api-key-signup.html)获取一个（免费的）API 密钥。

```
FDC_API_KEY=DEMO_KEY
```

#### 连接器

- `DISABLE_EXTERNAL_CONNECTORS` 是一个全局开关，用于完全禁用外部连接器。
- `EXTERNAL_CONNECTORS_QUEUE_SIZE` 是当工作进程处理不过来时保存在内存中的变更数量。

（外部）连接器用于将 Tandoor 中的状态同步到其他服务。更多信息可参见[此处](https://docs.tandoor.dev/features/connectors/)。

```env
DISABLE_EXTERNAL_CONNECTORS=0  # Default 0 (false), set to 1 (true) to disable connectors
EXTERNAL_CONNECTORS_QUEUE_SIZE=100  # Defaults to 100, set to any number >1
```

### 调试/开发设置

!!! warning
    这些设置不应在生产环境中保持启用，因为它们可能会给对手提供额外的攻击面和信息。

#### 调试

> default `0` - options: `0`, `1`

!!! info
    在任何地方发布日志求助之前，请先启用此项。

将其设为 `1` 会启用若干 django 调试功能以及额外的日志（[参见文档](https://docs.djangoproject.com/en/5.0/ref/settings/#std-setting-DEBUG)）。

```
DEBUG=0
```

#### 调试工具栏

> default `0` - options: `0`, `1`

设为 `1` 以启用 django 调试工具栏中间件。只有当设置了 `DEBUG=1` 且发起请求的 IP 位于 `INTERNAL_IPS` 中时，工具栏才会显示。
参见 [Django Debug Toolbar 文档](https://django-debug-toolbar.readthedocs.io/en/latest/)。

```
DEBUG_TOOLBAR=0
```

#### SQL 调试

> default `0` - options: `0`, `1`

设为 `1` 以在搜索页面上输出额外的查询信息。

```
SQL_DEBUG=0
```

#### 应用日志级别

> default `WARNING` - options: [参见 Django 文档](https://docs.djangoproject.com/en/5.0/topics/logging/#loggers)

提高或降低应用输出的日志量。
提交缺陷报告时请设为 `DEBUG`。

```
 LOG_LEVEL="DEBUG"
```


#### Gunicorn 日志级别

> default `info` - options: [参见 Gunicorn 文档](https://gunicorn.org/reference/settings/#loglevel)

提高或降低 gunicorn（Python wsgi 应用）输出的日志量。

```
 GUNICORN_LOG_LEVEL="debug"
```

### 默认用户偏好

设置默认用户偏好是很有用的，这样注册你实例的用户就已经拥有你认为合适的设置。

#### 分数

> default `0` - options: `0`,`1`

用户偏好项「fractions」的默认值（以小数还是分数形式显示数量）。

```
FRACTION_PREF_DEFAULT=0
```

#### 评论

> default `1` - options: `0`,`1`

用户偏好项「comments」的默认值（启用/禁用评论系统）

```
COMMENT_PREF_DEFAULT=1
```

#### 粘性导航

> default `1` - options: `0`,`1`

用户偏好项「sticky navigation」的默认值（始终在顶部显示导航栏，还是滚动时隐藏）

```
STICKY_NAV_PREF_DEFAULT=1
```

#### 最大拥有空间数

> default `100` - options: `0-X`

用户可拥有的空间数量的默认值。设为 0 将禁用用户创建空间。超级用户始终可以突破此限制。

```
MAX_OWNED_SPACES_PREF_DEFAULT=100
```


### 外观 / 偏好

#### 时区

> default `Europe/Berlin` - options: [参见时区数据库](https://timezonedb.com/time-zones)

用于数据库连接的默认时区（[参见 Django 文档](https://docs.djangoproject.com/en/5.0/ref/settings/#time-zone)）。
通常所有内容都会转换为用户所在时区，因此此设置实际上并不需要完全准确。

```
TZ=Europe/Berlin
```

#### 默认主题
> default `0` - options `1-X`（空间 ID）

Tandoor 的外观可以在用户和空间级别进行修改，但未认证用户始终看到 tandoor 的默认样式。
通过此设置，你可以指定一个空间的 ID，当用户未登录时将应用该空间的外观设置。

```
UNAUTHENTICATED_THEME_FROM_SPACE=
```

#### 强制主题
> default `0` - options `1-X`（空间 ID）

与默认主题类似，但会强制对所有用户（已认证/未认证）和所有空间应用该主题

```
FORCE_THEME_FROM_SPACE=
```

### 速率限制 / 性能

#### 购物清单自动同步

> default `5` - options: `1-XXX`

用户可以设置一个时间间隔，达到后购物清单会自动刷新。
这是用户可设置的最小间隔。将其设为较小的值会允许用户非常频繁地自动刷新，这可能会给服务器带来高负载。（从技术上讲，用户显然可以用自己的脚本随意刷新）

```
SHOPPING_MIN_AUTOSYNC_INTERVAL=5
```

#### API URL 导入限流

> default `60/hour` - options: `x/hour`, `x/day`, `x/minute`, `x/second`

限制用户每小时可以导入的菜谱数量。
建议设置速率限制，以防止用户滥用你的服务器进行（DDoS）中继攻击，并防止外部服务提供方因请求过多而封禁你的服务器。

```
DRF_THROTTLE_RECIPE_URL_IMPORT=60/hour
```

#### 默认空间限制
你可能希望限制用户可创建的资源数量。以下设置会自动应用于新创建的空间。空间创建之后，可以在管理后台中修改这些默认值。

如果未设置，所有设置默认均为无限制/启用

```
SPACE_DEFAULT_MAX_RECIPES=0 # 0=unlimited recipes
SPACE_DEFAULT_MAX_USERS=0 # 0=unlimited users per space
SPACE_DEFAULT_MAX_FILES=0 # Maximum file storage for space in MB. 0 for unlimited, -1 to disable file upload.
SPACE_DEFAULT_ALLOW_SHARING=1 # Allow users to share recipes with public links
```

#### 导出文件缓存
> default `600` - options `1-X`

菜谱导出默认会缓存一段时间（单位：秒），如有需要可调整该时间
```
EXPORT_FILE_CACHE_DURATION=600
```

### Zip 导入设置

从 zip 文件导入菜谱的配置选项。

#### 最大 zip 文件大小

> default `10` (10MB) - options: 以 MB 为单位的大小

zip 压缩包中单个文件的最大大小。

```
MAX_ZIP_FILE_SIZE=10
```

#### 最大 zip 总大小

> default `500` (500MB) - options: 以 MB 为单位的大小

zip 压缩包中所有文件解压后的最大总大小。

```
MAX_ZIP_TOTAL_SIZE=500
```

#### 最大 zip 文件数量

> default `2000` - options: 文件数量

zip 压缩包中允许的最大文件数量。

```
MAX_ZIP_FILE_COUNT=2000
```

#### 最大 zip 嵌套深度

> default `2` - options: 嵌套层级

zip 文件（压缩包中再含压缩包）允许的最大嵌套深度。

```
MAX_ZIP_NESTING_DEPTH=2
```
