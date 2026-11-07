!!! info "社区贡献"
    本节中的示例由社区成员贡献。
    本页面尤其包含一些配置方案，如果你确实想走某条特定的路，它们可能会有所帮助，但
    没有任何示例受到支持（因为我实在无法为它们提供支持）。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而不是 8080 端口。

## Apache + Traefik + 子路径

本指南由 [incaseoftrouble](https://github.com/incaseoftrouble) 在 [Issue #266](https://github.com/vabene1111/recipes/issues/266) 中贡献

我的配置是 docker-compose / traefik / apache / recipes。将 apache 换成 nginx 应该很直接。

相关部分：

docker-compose：
```yaml
  apache:
    # omitting other config
    volumes:
      - ./recipes/static:/var/www/recipes/static:ro
      - ./recipes/media:/var/www/recipes/media:ro
    labels:
      traefik.enable: true
      traefik.http.routers.apache-recipes.rule: Host(`<host>`) && PathPrefix(`/<www path>`)
      traefik.http.routers.apache-recipes.entrypoints: http
      traefik.http.routers.apache-recipes.service: apache
      traefik.http.services.apache.loadbalancer.server.port: 80
      traefik.http.services.apache.loadbalancer.server.scheme: http
...

  recipes:
    volumes:
      - ./recipes/static:/opt/recipes/staticfiles:rw
      - ./recipes/media:/opt/recipes/mediafiles:rw
    environment:
      # all the other env
      - SCRIPT_NAME=/<sub path>
      - STATIC_URL=/<www path>/static/
      - MEDIA_URL=/<www path>/media/
    labels:
      traefik.enable: true
      traefik.http.routers.recipes.rule: Host(`<host>`) && PathPrefix(`/<sub path>`)
      traefik.http.routers.recipes.entrypoints: http
      traefik.http.services.recipes.loadbalancer.server.port: 8080
      traefik.http.services.recipes.loadbalancer.server.scheme: http
```

apache: 
```
  Alias /<www path>/static/ /var/www/recipes/static/
  Alias /<www path>/media/ /var/www/recipes/media/
  <Directory "/var/www/recipes/">
    Require all granted
  </Directory>
```

为简单起见，我使用了两个路径 `<sub path>` 和 `<www path>`。在我的情况下 `<sub path> = recipes`，`<www path> = serve/recipes`。也可以更改 traefik 的匹配规则，将所有内容放在一个路径下。

为简单起见，我在本示例中省略了 TLS 配置。

## Docker + Apache + 子路径

如果你不使用 Traefik，而是运行 Apache 作为反向代理，将共享（子）域名的所有调用路由到一个子路径，例如 https://mydomain.tld/tandoor，那么以下内容可能会很有用

顺便说一句，我使用 [Blocky](https://0xerr0r.github.io/blocky/) + [Consul](https://hub.docker.com/r/hashicorp/consul) + [Registrator](https://hub.docker.com/r/gliderlabs/registrator) 作为 DNS 解决方案。

相关的 Apache 配置：
```
    <Location /tandoor>
        # in case you want to restrict access to specific IP addresses:
        Require local
        Require forward-dns [myhomedomain.useyourdomain.com]
        Require ip [anylocalorremoteipyouwanttowhitelist]

        # The following assumes that tandoor.service.consul.local resolves to the IP address of the Docker container.
        ProxyPass http://tandoor.service.consul.local:8080/tandoor
        ProxyPassReverse http://tandoor.service.consul.local:8080/tandoor
        RequestHeader add X-Script-Name /tandoor
        RequestHeader set X-Forwarded-Proto "https"
        ProxyPreserveHost On
    </Location>
    <Location /tandoor/static>
        Require local
        Require forward-dns [myhomedomain.useyourdomain.com]
        Require ip [anylocalorremoteipyouwanttowhitelist]

        ProxyPass http://tandoor.service.consul.local:8080/tandoor/tandoor/static
        ProxyPassReverse http://tandoor.service.consul.local:8080/tandoor/static
        RequestHeader add X-Script-Name /tandoor
        RequestHeader set X-Forwarded-Proto "https"
        ProxyPreserveHost On
    </Location>
```
以及 docker-compose.yml 中的相关部分：
```
   tandoor:
     restart: always
     container_name: tandoor
     image: vabene1111/recipes
     environment:
       - SCRIPT_NAME=/tandoor
       - STATIC_URL=/tandoor/static/
       - MEDIA_URL=/tandoor/media/
       - GUNICORN_MEDIA=0
       - SECRET_KEY=${YOUR_TANDOOR_SECRET_KEY}
       - POSTGRES_HOST=postgres.service.consul.local
       - POSTGRES_PORT=${POSTGRES_PORT}
       - POSTGRES_USER=${YOUR_TANDOOR_POSTGRES_USER}
       - POSTGRES_PASSWORD=${YOUR_TANDOOR_POSTGRES_PASSWORD}
       - POSTGRES_DB=${YOUR_TANDOOR_POSTGRES_DB}
     labels:
        # The following is relevant only if you are using Registrator and Consul
       - "SERVICE_NAME=tandoor"
     volumes:
       - ${YOUR_DOCKER_VOLUME_BASE_DIR}/tandoor/static:/opt/recipes/staticfiles:rw
       # Do not make this a bind mount, see https://docs.tandoor.dev/install/docker/#volumes- vs-bind-mounts
       - tandoor_nginx_config:/opt/recipes/nginx/conf.d
       - ${YOUR_DOCKER_VOLUME_BASE_DIR}}/tandoor/media:/opt/recipes/mediafiles:rw
     depends_on:
        # You will have to set up postgres accordingly
       - postgres
```

用于 Registrator、Consul、Blocky 和 Autoheal 的相关 docker-compose.yml：
```
  consul:
    image: hashicorp/consul
    container_name: consul
    command: >
      agent -server
      -domain consul.local
      -advertise=${YOUR_DOCKER_HOST_IP_ON_THE_LAN}
      -client=0.0.0.0
      -encrypt=${SOME_SECRET_KEY}
      -datacenter=${YOUR_DC_NAME}
      -bootstrap-expect=1
      -ui
      -log-level=info
    environment:
      - "CONSUL_LOCAL_CONFIG={\"skip_leave_on_interrupt\": true, \"dns_config\": { \"service_ttl\": { \"*\": \"0s\" } } }"
    network_mode: "host"
    restart: always

  registrator:
    image: gliderlabs/registrator:latest
    container_name: registrator
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
    command: >
      -internal
      -cleanup=true
      -deregister="always"
      -resync=60
      consul://host.docker.internal:8500
    restart: always

  blocky:
    image: spx01/blocky
    container_name: blocky
    restart: unless-stopped
    healthcheck:
      interval: 30s
      timeout: 5s
      start_period: 1m
    labels:
        # The following is only relevant if you use autoheal
      autoheal: true
    # Optional the instance hostname for logging purpose
    hostname: blocky
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "1153:53/tcp"
      - "1153:53/udp"
      - 4000:4000
    environment:
      - TZ=YOUR_TIMEZONE # Optional to synchronize the log timestamp with host
    volumes:
      # Optional to synchronize the log timestamp with host
      - /etc/localtime:/etc/localtime:ro
      # config file
      - ${YOUR_DOCKER_VOLUME_BASE_DIR}/blocky/config.yml:/app/config.yml
    networks:
        # in case you want to bind Blocky to an IP address
      your-docker-network-name:
        ipv4_address: 'some-ip-address-in-the-docker-network-subnet'

  autoheal:
    image: willfarrell/autoheal
    volumes:
        - '/var/run/docker.sock:/var/run/docker.sock'
    environment:
        - AUTOHEAL_CONTAINER_LABEL=autoheal
    restart: always
    container_name: autoheal

```
以及 Blocky 配置的片段：
```
conditional:
  fallbackUpstream: false
  mapping:
    consul.local: tcp+udp:host.docker.internal:8600
```


## WSL

如果你想在 Windows Subsystem for Linux 上安装 Tandoor，可以在这里找到详细的帖子：<https://github.com/TandoorRecipes/recipes/issues/1733>。
