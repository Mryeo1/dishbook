!!! danger
        请参阅[官方文档](https://github.com/linuxserver/docker-swag#usage)进行容器设置。本示例仅展示一种设置，可能（也可能不会）与你的设置在重要方面有所不同。本教程不涵盖安全措施、备份以及你可能需要考虑的许多其他事项。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

## 前提条件

- 你有一台新启动的 Ubuntu 服务器，已（预先）安装 Docker。
- 至少有一个 `mydomain.com` 和一个 `mysubdomain.mydomain.com` 指向服务器 IP。（本教程不涵盖子文件夹安装。）
- 你已打开 ssh 终端会话。

## 安装

### 下载并编辑 Tandoor 配置

```
cd /opt
mkdir recipes
cd recipes
wget https://raw.githubusercontent.com/vabene1111/recipes/develop/.env.template -O .env
base64 /dev/urandom | head -c50
``` 
复制最后一条命令的输出，并将该密钥粘贴到 `.env` 文件中：
```
nano .env
```
你还需要在 `.env` 文件中输入 Postgres 密码。然后保存文件并退出编辑器。

### 安装并配置 Docker Compose

按照[这些说明](https://docs.linuxserver.io/general/docker-compose)：
```
cd /opt
curl -L --fail https://raw.githubusercontent.com/linuxserver/docker-docker-compose/master/run.sh -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

接下来，创建并编辑 docker compose 文件。

```
nano docker-compose.yml
```

粘贴以下内容，并调整你的域名、子域名和时区。

```
---
version: "2.1"
services:
  swag:
    image: ghcr.io/linuxserver/swag
    container_name: swag
    cap_add:
      - NET_ADMIN
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin # <---- EDIT THIS <----  <---- 
      - URL=mydomain.com # <---- EDIT THIS <----  <---- 
      - SUBDOMAINS=mysubdomain,myothersubdomain # <---- EDIT THIS <----  <---- 
      - EXTRA_DOMAINS=myotherdomain.com # <---- EDIT THIS <----  <---- 
      - VALIDATION=http
    volumes:
      - ./swag:/config
      - ./recipes/media:/media
    ports:
      - 443:443
      - 80:80
    restart: unless-stopped

  db_recipes:
    restart: always
    container_name: db_recipes
    image: postgres:16-alpine
    volumes:
      - ./recipes/db:/var/lib/postgresql/data
    env_file:
      - ./recipes/.env

  recipes:
    image: vabene1111/recipes
    container_name: recipes
    restart: unless-stopped
    env_file:
      - ./recipes/.env
    environment:
      - UID=1000
      - GID=1000
      - TZ=Europe/Berlin # <---- EDIT THIS  <----  <---- 
    volumes:
      - ./recipes/static:/opt/recipes/staticfiles
      - ./recipes/media:/opt/recipes/mediafiles
    depends_on:
      - db_recipes
```

保存并退出。

### 创建容器并配置 swag 反向代理

```
docker-compose up -d
```

```
cd /opt/swag/nginx/proxy-confs
cp recipes.subdomain.conf.sample recipes.subdomain.conf
nano recipes.subdomain.conf
```

将 `server_name recipes.*;` 一行改为 `server_name mysubdomain.*;`，保存并退出。

### 完成

```
cd /opt
docker restart swag recipes
```

访问 `https://mysubdomain.mydomain.com`。（如果遇到「502 Bad Gateway」错误，请耐心等待。可能需要一段时间才能正常工作。）
