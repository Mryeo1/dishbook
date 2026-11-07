# 手动安装说明

这些说明受标准的 django/gunicorn/postgresql 安装说明启发（[例如](https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-16-04)）

!!! warning
    请确保使用至少 Python 3.12 或更高版本，并确保 `pip` 与 Python 3 关联。根据你的系统配置，使用 `python` 或 `pip` 可能会默认指向 Python 2。确保你的机器至少有 2048 MB 内存；否则 `yarn build` 过程可能会失败，并报错：`FATAL ERROR: Reached heap limit - Allocation failed: JavaScript heap out of memory`。

!!! warning
    这些说明**不会**定期审核，可能已经过时。

## 前提条件

设置用户：`sudo useradd recipes`

更新软件源并升级操作系统：`sudo apt update && sudo apt upgrade -y`

安装所有前提依赖 `sudo apt install -y git curl python3 python3-pip python3-venv nginx`

从仓库获取最新版本：`git clone https://github.com/vabene1111/recipes.git -b master`

将其移动到 `/var/www` 目录：`mv recipes /var/www`

切换到该目录：`cd /var/www/recipes`

授予用户权限：`chown -R recipes:www-data /var/www/recipes`

创建虚拟环境：`python3 -m venv /var/www/recipes`

激活虚拟环境：`source /var/www/recipes/bin/activate`

安装 Javascript 工具（需要 nodejs >= 12）
```shell
### Just use one of these possibilites!
# Using Ubuntu
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Using Debian, as root
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Using a RPM based distro
## ... as root
curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -

## ... no root privileges
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
```
```shell
sudo npm install --global yarn
```

!!! info "NodeJS 安装问题"
    如果你在 NodeJS 安装过程中遇到问题，请参考[官方文档](https://github.com/nodesource/distributions/blob/master/README.md)。

### 安装 postgresql 依赖

```shell
sudo apt install -y libpq-dev postgresql
```

### 安装 LDAP 依赖

```shell
sudo apt install -y libsasl2-dev python3-dev libldap2-dev libssl-dev
```

### 安装项目依赖

!!! warning "更新"
    依赖会随着大多数更新而变化，因此以下步骤需要在每次更新时重新运行，否则应用可能会停止工作。
    参见下方的[更新](#updating)一节。

使用虚拟环境中的二进制文件：

```shell
/var/www/recipes/bin/pip3 install -r requirements.txt
```

你还需要安装前端依赖并构建它们。为此，请进入 `./vue3` 文件夹并运行

```shell
cd ./vue3
yarn install
yarn build
```

## 设置 postgresql

```shell
sudo -u postgres psql
```

在 psql 控制台中：

```sql
CREATE DATABASE djangodb;
CREATE USER djangouser WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE djangodb TO djangouser;
ALTER DATABASE djangodb OWNER TO djangouser;

--Maybe not necessary, but should be faster:
ALTER ROLE djangouser SET client_encoding TO 'utf8';
ALTER ROLE djangouser SET default_transaction_isolation TO 'read committed';
ALTER ROLE djangouser SET timezone TO 'UTC';

--Grant superuser right to your new user, it will be removed later
ALTER USER djangouser WITH SUPERUSER;

--exit Postgres Environment
exit
```

下载 `.env` 配置文件并**相应地编辑它**。
```shell
wget https://raw.githubusercontent.com/vabene1111/recipes/develop/.env.template -O /var/www/recipes/.env
```

需要编辑的内容：

- `SECRET_KEY`：使用安全的内容（例如用 `base64 /dev/urandom | head -c50` 生成）。
- `POSTGRES_HOST`：可能是 127.0.0.1。
- `POSTGRES_PASSWORD`：我们之前设置 djangodb 时设置的密码。
- `STATIC_URL`、`MEDIA_URL`：它们将分别位于 `/var/www/recipes` 下的 `/staticfiles/` 和 `/mediafiles/`。

## 初始化应用

执行 `export $(cat /var/www/recipes/.env |grep "^[^#]" | xargs)` 从 `/var/www/recipes/.env` 加载变量

执行 `bin/python3 manage.py migrate`

并将 postgres 中的超级用户还原：

```
sudo -u postgres psql` and `ALTER USER djangouser WITH NOSUPERUSER;
exit
```

生成静态文件：`bin/python3 manage.py collectstatic --no-input` 和 `bin/python3 manage.py collectstatic_js_reverse`，并记住文件被复制到的文件夹。

## 设置 Web 服务

### gunicorn

创建一个在启动时启动 gunicorn 的服务：`sudo nano /etc/systemd/system/gunicorn_recipes.service`

并输入以下行：

```service
[Unit]
Description=gunicorn daemon for recipes
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=3
User=recipes
Group=www-data
WorkingDirectory=/var/www/recipes
EnvironmentFile=/var/www/recipes/.env
ExecStart=/var/www/recipes/bin/gunicorn --error-logfile /tmp/gunicorn_err.log --log-level debug --capture-output --bind unix:/var/www/recipes/recipes.sock recipes.wsgi:application

[Install]
WantedBy=multi-user.target
```

*注意*：`-error-logfile /tmp/gunicorn_err.log --log-level debug --capture-output` 对调试很有用，之后可以移除

*注意2*：将 `ExecStart` 行中的路径修正为你的 gunicorn 和 recipes 所在的位置

最后，运行 `sudo systemctl enable --now gunicorn_recipes`。你可以使用 `systemctl status gunicorn_recipes` 检查服务是否已正确启动

### nginx

现在我们要让 nginx 监听一个新端口，并将其转发给 gunicorn。`sudo nano /etc/nginx/conf.d/recipes.conf`

并输入以下行：

```nginx
server {
    listen 8002;
    #access_log /var/log/nginx/access.log;
    #error_log /var/log/nginx/error.log;

    # serve media files
   location /static/ {
    alias /var/www/recipes/staticfiles/;
}

location /media/ {
    alias /var/www/recipes/mediafiles/;
}

    location / {
        proxy_set_header Host $http_host;
        proxy_pass http://unix:/var/www/recipes/recipes.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

*注意*：在 static 和 proxy_pass 行中输入正确的路径。

重新加载 nginx：`sudo systemctl reload nginx`

## 更新 {#updating}
为了更新应用，你需要运行以下命令（最好将它们放进一个小脚本中）。

```shell
# change directory
cd /var/www/recipes
# Update source files
git pull
# load envirtonment variables
export $(cat /var/www/recipes/.env |grep "^[^#]" | xargs)
#install project requirements
bin/pip3 install -r requirements.txt
# migrate database 
bin/python3 manage.py migrate
# collect static files
# if the output is not "0 static files copied" you might want to run the commands again to make sure everythig is collected
bin/python3 manage.py collectstatic --no-input
bin/python3 manage.py collectstatic_js_reverse
# change to frontend directory
cd vue3
# install and build frontend
yarn install
yarn build
# restart gunicorn service
sudo systemctl restart gunicorn_recipes
```
