# 部署到一台云主机

目标：评审点开一个链接就能看到带数据的实例。下面是一台最小配置 VPS（2C2G，Debian 12）的完整步骤。

> 状态说明：本机没有 Docker，也没有云主机凭证，因此**第 2 节的 Docker 方案未在本机验证**，第 1 节的裸机方案与本机开发环境一致（同样的 `manage.py` 与构建脚本）。有疑问的地方标了「验证点」。

## 0. 必须改的配置

`.env` 里这几项决定线上能不能跑通，少一项就会 400/403：

```ini
SECRET_KEY=<随机 50 位，不要复用开发环境的>
DEBUG=0
ALLOWED_HOSTS=recipes.example.com
CSRF_TRUSTED_ORIGINS=https://recipes.example.com
TIMEZONE=Asia/Shanghai

# 会话策略：沿用本项目的双规则
SESSION_IDLE_TIMEOUT=300
SESSION_MAX_AGE=10800

# 让 Django 直接提供 /media/（图片）。若用 nginx 直接发静态文件，可关掉
GUNICORN_MEDIA=1
```

`CSRF_TRUSTED_ORIGINS` 必须带协议，否则登录会 403；`ALLOWED_HOSTS` 不带端口。

## 1. 裸机（gunicorn + nginx）

```bash
# 依赖
sudo apt update && sudo apt install -y python3.12 python3.12-venv python3-pip \
    libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libssl-dev \
    zlib1g-dev libjpeg-dev libwebp-dev nginx nodejs npm git

sudo useradd -m -s /bin/bash recipes
sudo -iu recipes
git clone <你的仓库地址> ~/app && cd ~/app

python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
(cd vue3 && npm install)

cp .env.template .env && vi .env      # 填第 0 节的内容

python manage.py migrate
python manage.py collectstatic --noinput
bash scripts/build_frontend.sh        # 构建前端并同步（脚本里已包含 sync）

# 演示数据（可选，但评审需要内容）
python scripts/reset_demo_data.py
python scripts/seed_demo_data.py
python scripts/seed_demo_images.py
```

systemd 单元 `/etc/systemd/system/recipes.service`：

```ini
[Unit]
Description=Dishbook (食单)
After=network.target

[Service]
User=recipes
WorkingDirectory=/home/recipes/app
EnvironmentFile=/home/recipes/app/.env
ExecStart=/home/recipes/app/.venv/bin/gunicorn recipes.wsgi:application \
    --bind 127.0.0.1:8000 --workers 3 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```

nginx 站点（只反代应用，静态与媒体让 Django 出，配置最简单）：

```nginx
server {
    listen 80;
    server_name recipes.example.com;
    client_max_body_size 64m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo systemctl enable --now recipes
sudo ln -s /etc/nginx/sites-available/recipes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d recipes.example.com    # HTTPS
```

**验证点**：HTTPS 打开后能登录、菜谱图片能显示（图片 404 说明 `GUNICORN_MEDIA` 没开或 `MEDIA_ROOT` 权限不对）、刷新页面不跳登录页（cookie 的 `Secure` 与会话策略一起生效）。

## 2. Docker（未本机验证）

上游仓库自带 `Dockerfile` 与 `docs/install/docker/plain/docker-compose.yml`，镜像内自带 nginx 与 gunicorn。参考用法：

```yaml
services:
  recipes:
    build: .
    env_file: .env
    ports: ["80:80"]
    volumes:
      - ./mediafiles:/opt/recipes/mediafiles
      - ./staticfiles:/opt/recipes/staticfiles
    restart: unless-stopped
```

注意两点：

1. 镜像内**不会**替你构建 `vue3`（上游在发布流水线里做）。首次启动前需要 `cd vue3 && npm install && npx vite build`，或把 `cookbook/static/vue3` 一起打进镜像。
2. 只要改了前端，就要重新 build 镜像，因为 `staticfiles` 里的 hash 文件名变了。

## 3. 交付前自检清单

- [ ] 冷启动（新浏览器、无 cookie）打开首页是**中文**
- [ ] 登录 `chenxiao@example.com / Tandoor@2026`，用餐计划里有 30 道带图菜谱
- [ ] 手机浏览器打开，用餐计划是议程列表而非七列网格
- [ ] 设置里切到深色，日历没有白色板块
- [ ] 页面放置超过 3 小时会弹「登录已过期」（可把 `SESSION_MAX_AGE` 临时改成 60 秒验证）
- [ ] `GET /setup/` 返回 302 而不是 500（已修）
- [ ] `https://<域名>/api/docs/` 可打开（`HEADLESS_ONLY` 下 API 文档由 spectacular 提供）
