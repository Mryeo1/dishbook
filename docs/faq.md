有一些问题和困惑会不时出现，这里给出其中一部分的答案：
请注意，某些问题的存在是因为应用在某些方面还不够完善。
其中许多缺陷计划在未来的版本中修复，但由于时间有限，目前还无法处理。

## 有 Tandoor 应用吗？
Tandoor 可以作为渐进式 Web 应用（PWA）安装在移动端和桌面端设备上。PWA 会在本地保存最近访问过的菜谱，以便离线使用。

### 移动端浏览器

#### Safari（iPhone/iPad）
打开 Tandoor，点击 Safari 的分享按钮，选择 `添加到主屏幕`

#### Chrome/Chromium
打开 Tandoor，点击屏幕底部弹出的「`将 Tandoor 添加到主屏幕`」提示

#### Firefox for Android
打开 Tandoor，点击 `⋮` 菜单图标，然后点击 `安装`

### 桌面端浏览器

#### Google Chrome
打开 Tandoor，打开右上角三个竖点后的菜单，选择 `安装 Tandoor Recipes...`

#### Microsoft Edge
打开 Tandoor，打开右上角三个横点后的菜单，选择 `应用 > 安装 Tandoor Recipes`

## 为什么 Tandoor 无法正常工作？
如果您刚搭建好 Tandoor 实例，就遇到了以下问题：

- 链接无法打开
- CSRF 错误
- CORS 错误
- 菜谱无法加载

那么请确认您已在反向代理中正确设置[所有必需的请求头](install/docker.md#required-headers)。
如果这样仍未解决，您也可以查阅[反向代理文档](install/docker.md#reverse-proxy)中的相应小节，并检查您的 Web 服务器常规配置。

### 必需的请求头
前往 `/system/` 并查看 DEBUG 部分列出的请求头。至少，如果您使用了反向代理，请求头必须满足以下条件。

| 请求头      | 要求 |
| :---        |    :----   |
| HTTP_HOST:mydomain.tld      | 主机域名必须与您访问 Tandoor 所使用的 URL 一致。  |
| HTTP_X_FORWARDED_HOST:mydomain.tld      | 主机域名必须与您访问 Tandoor 所使用的 URL 一致。  |
| HTTP_X_FORWARDED_PROTO:http(s)      | 协议必须与您访问 Tandoor 所使用的 URL 一致。且只能列出一个协议。  |
| HTTP_X_SCRIPT_NAME:/subfolder      | 如果您将 Tandoor 托管在子目录而非子域名下，则必须存在此请求头。 |


## 为什么登录时会收到 403 错误？

从 2.6.1 版本开始，Tandoor 内置了登录速率限制，以防止暴力破解攻击。
这要求 Tandoor 从应用前方反向代理所设置的 `X-Forwarded-For` 请求头中确定您的客户端 IP 地址。

Tandoor 内置的 nginx 始终被视为一个可信代理，因此默认设置
`ALLAUTH_TRUSTED_PROXY_COUNT=1` 适用于大多数部署方式。如果您还运行了其他反向代理
（Traefik、Caddy、nginx proxy manager 等）并且在登录时遇到 403 错误，请将该值调大，
使其等于您代理的总数（包括 Tandoor 内置的 nginx）。

例如，如果您在 Tandoor 前方运行了一个外部反向代理：
```
ALLAUTH_TRUSTED_PROXY_COUNT=2
```

更多细节请参阅[配置文档](system/configuration.md#trusted-proxy-count)。

## 为什么会出现 CSRF 错误？
如果出现 CSRF 错误，最可能是反向代理没有传递正确的请求头。

如果您使用的是 linuxserver 的 swag，可能需要在 nginx 配置中加入 `proxy_set_header X-Forwarded-Proto $scheme;`。
如果您使用的是原生 nginx，可能需要加入 `proxy_set_header Host $http_host;`。

更多讨论见 [Issue #518](https://github.com/vabene1111/recipes/issues/518)

## 为什么图片无法加载？
如果图片无法加载，可能与 CSRF 错误是同一个原因（见上文）。
相关讨论见 [Issue #452](https://github.com/vabene1111/recipes/issues/452)

另一个常见原因是部署栈中移除了推荐的 nginx 容器。
如果已移除，则需要用其他方式提供 `/mediafiles/` 目录的访问，或者需要启用
`GUNICORN_MEDIA`，以允许应用容器自身提供媒体文件服务。

## 为什么会出现提示数据库文件与服务器不兼容的错误？
您的 Postgres 版本已被升级。请参阅[更新 PostgreSQL](https://docs.tandoor.dev/system/updating/#postgresql)


## 为什么文本/Markdown 预览与最终菜谱看起来不一样？

Tandoor 一直是在服务器端渲染菜谱步骤的 markdown。这也让 Tandoor 能够在文本中实现食材模板化和份数缩放等功能。
为便于编辑，前端添加了带集成预览的 markdown 编辑器，作为临时方案。由于该 markdown 编辑器使用的
规范与服务器端不同，预览效果与最终结果会有差异。未来计划改进这一点。

markdown 渲染器遵循此 markdown 规范 https://daringfireball.net/projects/markdown/

## 为什么 Tandoor 在我的树莓派上无法运行？

请参阅[此处](install/docker.md#setup-issues-on-raspberry-pi)。

## 如何创建用户？
要创建新用户，请点击您的名字（位于右上角）并选择「空间设置」。点击邀请下方的创建。

无法通过管理后台创建用户，因为用户必须被分配默认的分组和空间。

要更改用户的空间，需要进入管理后台并选择 User Infos。

如果您使用外部认证提供方或代理认证，请确保在环境配置中指定默认分组和空间。

## 什么是空间？
空间是一种用于将 Tandoor 的一个安装实例划分为多个部分的功能。
从技术上讲，它是一个多租户系统。

您可以把空间类比为 Google Drive 或 Dropbox 这样的服务。
Dropbox 系统只有一个安装实例，但它能服务多个用户，而用户之间互不察觉。
对 Tandoor 而言，这意味着所有共同维护同一份菜谱收藏的人可以处于同一个空间。
如果您想为朋友、家人或邻居托管他们的收藏，可以（通过管理后台）为他们创建一个独立的空间。

目前尚不支持空间之间的分享，但已计划在未来版本中提供。

## 如何重置密码？
如果无法访问容器，要重置丢失的密码，您需要：

1. 使用 `docker-compose exec web_recipes sh` 进入容器
2. 激活虚拟环境 `source venv/bin/activate`
3. 运行 `python manage.py changepassword <username>` 并按提示操作。

## 如何添加管理员用户？
要创建超级用户，您需要

1. 使用 `docker-compose exec web_recipes sh` 进入容器
2. 激活虚拟环境 `source venv/bin/activate`
3. 运行 `python manage.py createsuperuser` 并按提示操作。


## 为什么我手动安装的部署得不到支持？
尽管我很希望帮助每个人把 Tandoor 跑起来，但在工作、家庭和其他生活事务之外，
我能投入这个项目的时间实在太少。
由于手动安装时可能出现数不清的问题，我确实没有时间逐一帮忙解决。

您可以手动安装 Tandoor，但请不要指望我或其他人来帮您。
一般建议是：如果您选择手动安装，一开始不要改动任何东西，然后慢慢调整
到您理想的配置。

## 如何升级 Postgres（大版本）？
从一个 Postgres 大版本升级到另一个大版本需要手动操作。大致步骤如下

1. 使用 `pg_dumpall` 将数据库导出为 SQL（Docker 下为 `docker-compose exec -T <postgres_container_name> pg_dumpall -U <postgres_user_name> -f /path/to/dump.sql`）
2. 停止数据库 / 关闭容器
3. 移动您的 postgres 目录以保留一份备份（例如 `mv postgres postgres_old`）
4. 将 postgres 更新到新的大版本（Docker 下只需修改版本号并拉取）
5. 启动数据库 / 启动容器（不要启动 Tandoor，因为它会自动执行数据库迁移，从而与导入转储冲突）
6. 如果未使用 Docker，您可能需要创建与旧数据库相同的 postgres 用户
7. 导入 postgres 转储（Docker 下为 `'/usr/local/bin/docker-compose exec -T <postgres_container_name> psql -U <postgres_user_name> <postgres_database_name> < /path/to/dump.sql`）

如果任何一步失败，请回到旧的 postgres 版本和数据目录后重试。

网上有许多文章和工具可以作为升级的良好起点 [1](https://thomasbandt.com/postgres-docker-major-version-upgrade)、[2](https://github.com/tianon/docker-postgres-upgrade)、[3](https://github.com/vabene1111/DockerPostgresBackups)。
