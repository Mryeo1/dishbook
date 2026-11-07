!!! success "推荐安装"
    推荐使用 Docker 搭建本应用。这并不意味着其他方式不好，但它是唯一
    由官方维护并定期接受测试的方式。

本指南展示了一些使用 Docker 和 docker compose 的基础配置方案。关于配置选项，请参阅[配置页面](https://docs.tandoor.dev/system/configuration/)。

## **版本**

[Docker Hub](https://hub.docker.com/r/vabene1111/recipes/tags) 上发布了不同的版本（标签）。

-   **latest** 默认镜像。如果你不确定自己是否需要别的，就使用这个。
-   **beta** 部分稳定的版本，会不时更新。请做好遇到一些问题的准备。
-   **develop** 如果你想要最新的、可能包含大量破坏性变更的版本，可以随意使用此版本（不推荐！）。
-   **X.Y.Z** 每个发布的版本都有自己的镜像。如果你需要回退到旧版本，或者想确保停留在某个特定版本，请使用这些标签。

!!! danger "不可降级"
    目前无法迁移回旧版本，因为没有降级数据库的机制。
    你或许可以自己做到，但我无法为此提供帮助。如果你想使用不稳定的镜像，请慎重选择。
    话虽如此，如果你喜欢频繁的更新和新功能，**beta** 通常是可以正常工作的。

## **Docker**

Docker 镜像（`vabene1111/recipes`）通过集成的 nginx Web 服务器，在容器的 `80` 端口上暴露应用。

```shell
docker run -d \
    -v "$(pwd)"/staticfiles:/opt/recipes/staticfiles \
    -v "$(pwd)"/mediafiles:/opt/recipes/mediafiles \
    -p 80:80 \
    -e SECRET_KEY=YOUR_SECRET_KEY \
    -e DB_ENGINE=django.db.backends.postgresql \
    -e POSTGRES_HOST=db_recipes \
    -e POSTGRES_PORT=5432 \
    -e POSTGRES_USER=djangodb \
    -e POSTGRES_PASSWORD=YOUR_POSTGRES_SECRET_KEY \
    -e POSTGRES_DB=djangodb \
    --name recipes_1 \
    vabene1111/recipes
```

请务必替换 ```SECRET_KEY``` 和 ```POSTGRES_PASSWORD``` 占位符！

## **Docker Compose**

本应用主要的、也是推荐的安装方式是 Docker Compose。

1. 从下面的示例中选择你的 `docker-compose.yml`。
2. 使用 `wget` 下载 `.env` 配置文件
    ```shell
    wget https://raw.githubusercontent.com/vabene1111/recipes/develop/.env.template -O .env
    ```
3. **相应地编辑它**（你必须设置 `SECRET_KEY`、`ALLOWED_HOSTS` 和 `POSTGRES_PASSWORD`），参见[配置页面](https://docs.tandoor.dev/system/configuration/)。
4. 使用 `docker-compose up -d` 启动容器。

### **Plain**

此配置通过容器化的 nginx Web 服务器，在你机器的 80 端口上暴露应用。
请注意，如果宿主机上的 80 端口有其他 Web 服务器或容器在运行，将会阻止其工作。

```shell
wget https://raw.githubusercontent.com/vabene1111/recipes/develop/docs/install/docker/plain/docker-compose.yml
```

~~~yaml
{% include "./docker/plain/docker-compose.yml" %}
~~~

### **反向代理** {#reverse-proxy}

大多数部署可能会使用反向代理。

#### **Traefik**

如果你使用 Traefik，那么这个配置适合你。

!!! info
    Traefik 的配置可能有些令人困惑。
    请参考[其出色的文档](https://doc.traefik.io/traefik/)。如果这没有帮助，
    [这个小示例](traefik.md)可能适合你。

```shell
wget https://raw.githubusercontent.com/vabene1111/recipes/develop/docs/install/docker/traefik-nginx/docker-compose.yml
```

~~~yaml
{% include "./docker/traefik-nginx/docker-compose.yml" %}
~~~


#### **jwilder 的 Nginx-proxy**

这是一个 docker compose 示例，结合使用 [jwilder 的 nginx 反向代理](https://github.com/jwilder/docker-gen)
和 [jrcs 的 letsencrypt companion](https://hub.docker.com/r/jrcs/letsencrypt-nginx-proxy-companion/)。

请参考相应的文档来了解如何设置反向代理和网络。

!!! warning "调整 client_max_body_size"
    使用 jwilder 的 Nginx-proxy 时，上传将被限制为 1 MB 的文件大小。可以通过调整 jwilder nginx 配置中的 ```client_max_body_size``` 变量来解决。

记得将相应的环境变量添加到 `.env` 文件中：

```
VIRTUAL_HOST=
LETSENCRYPT_HOST=
LETSENCRYPT_EMAIL=
```

```shell
wget https://raw.githubusercontent.com/vabene1111/recipes/develop/docs/install/docker/nginx-proxy/docker-compose.yml
```

~~~yaml
{% include "./docker/nginx-proxy/docker-compose.yml" %}
~~~


#### **Apache 代理**

如果你使用 Apache 作为反向代理，那么这个配置适合你。

~~~yaml
{% include "./docker/apache-proxy/docker-compose.yml" %}
~~~

请记住，为服务 `web_recipes` 配置的端口应与章节 [必需的请求头：Apache](#apache) 中的端口相同。

## **DockSTARTer**

[DockSTARTer](https://dockstarter.com/) 的主要目标是让 Docker 的上手和运行变得快速而简单。
你可以选择依靠 DockSTARTer 对你的 Docker 系统进行各种更改，也可以将 DockSTARTer 作为垫脚石，学习进行更高级的配置。
按照指南安装 DockSTARTer，然后运行 `ds`，再选择「Configuration」和「Select Apps」，即可快速轻松地启动并运行 Tandoor。


!!!note
    DockSTARTer 可能尚未针对 Tandoor 2 的配置进行更新

## **附加信息**

### **Nginx 配置**
从 Tandoor 2 开始，Docker 容器包含一个 nginx 服务。其默认配置从仓库中的 [http.d](https://github.com/TandoorRecipes/recipes/tree/develop/http.d) 文件夹拉取。

你可以设置一个卷，链接到容器内的 ```/opt/recipes/http.d``` 文件夹来更改配置。请记住，如果你是手动更改配置/将该文件夹绑定为卷，你将不会收到配置的任何更新。


### **必需的请求头** {#required-headers}

请确保在你的 nginx/Apache/Caddy/... 配置中提供所有必需的请求头！

#### **nginx**

```nginx
location / {
    proxy_set_header Host $http_host; # try $host instead if this doesn't work
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:8080; # replace port
    proxy_redirect http://127.0.0.1:8080 https://recipes.domain.tld; # replace port and domain
}
```

#### **Apache** {#apache}

```apache
RequestHeader set X-Forwarded-Proto "https"
Header always set Access-Control-Allow-Origin "*"

ProxyPreserveHost  On
ProxyRequests Off
ProxyPass / http://localhost:8080/ # replace port
ProxyPassReverse / http://localhost:8080/ # replace port
```

### **Raspberry Pi 上的安装问题** {#setup-issues-on-raspberry-pi}

!!! danger
    Tandoor 2 不再为 arm/v7 架构构建镜像。你当然可以在这些架构上让 Tandoor 运行起来，但过去这些年维护这些架构的投入实在太大，
    无法为这个基本已弃用的平台继续提供支持。

!!!info
    首次启动后请务必至少等待 2-3 分钟，因为迁移会花费一些时间！


如果你在 Raspberry Pi 或类似设备上安装 Tandoor 时遇到问题，
请按照以下说明操作：

- 停止所有 Tandoor 容器（`docker-compose down`）
- 删除本地数据库文件夹（通常是位于 `docker-compose.yml` 文件所在目录中的「postgresql」）
- 再次启动 Tandoor 容器（`docker-compose up -d`）
- 至少等待 2-3 分钟，然后检查现在是否一切正常（迁移可能会花费相当长的时间！）
- 如果仍不正常，请使用 `docker logs <container_name>` 检查 web_recipes 容器的日志，并确认所有迁移确实已经完成

### 子路径 nginx 配置

如果托管在子路径下，你可能想使用以下配置更改默认的 nginx 配置。

```nginx
location /my_app { # change to subfolder name
    include /config/nginx/proxy.conf;
    proxy_pass https://mywebapp.com/; # change to your host name:port
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Script-Name /my_app; # change to subfolder name
    proxy_cookie_path / /my_app; # change to subfolder name
}

location /media/ {
    include /config/nginx/proxy.conf;
    alias /mediafiles/;
    client_max_body_size 16M;

}

location /static/ {
    include /config/nginx/proxy.conf;
    alias /staticfiles/;
    client_max_body_size 16M;

}
```
### Tandoor 1 与 Tandoor 2
Tandoor 1 包含 gunicorn，这是一个 Python WSGI 服务器，能很好地处理 Python 代码，但不适合提供媒体文件。因此，一直建议在 Tandoor 前面设置一个 nginx Web 服务器
（而不仅仅是反向代理）来处理媒体文件。gunicorn 服务器默认暴露在 8080 端口。

Tandoor 2 现在将 nginx 打包进容器内，并暴露 80 端口，媒体文件由 nginx 处理，所有其他请求（大部分）传递给 gunicorn。

已创建一个 [GitHub Issue](https://github.com/TandoorRecipes/recipes/issues/3851) 用于在此变更刚刚推出期间就此问题展开讨论和常见问题解答。如有必要，之后会在此处的文档中更新。
