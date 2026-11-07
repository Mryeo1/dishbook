!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

本指南旨在帮助那些使用 Docker 和/或 Portainer 在 TrueNAS Core 上安装 Tandoor Recipes 的用户

Docker 安装说明改编自 [PhasedLogix IT Services 的指南](https://getmethegeek.com/blog/2021-01-07-add-docker-capabilities-to-truenas-core/)。Portainer 安装说明采用 [Portainer 官方文档](https://docs.portainer.io/start/install-ce/server/docker/linux)。在 Portainer 上安装 Tandoor 由 Discord 用户 `Szeraax` 和 `TransatlanticFoe` 提供（感谢二位！）

## **说明**

在 TrueNAS Core 上设置 Docker 和 Portainer 的基本指南。

### 1. 通过浏览器登录 TrueNAS
- 转到虚拟机菜单
![TrueNAS 虚拟机菜单截图[(https://d33wubrfki0l68.cloudfront.net/e5bc016268e41fadea77fd91a35c40d52280d221/c9daf/images/blog/truenasvmpage.png)
- 点击添加以新建虚拟机。你需要以下设置：
	-客户机操作系统：Linux
	-名称：UBUDocker（或你想要的任何名称）
	-系统时钟：本地
	-启动方式：UEFI
	-关机时间：90
	-已启用开机启动
	-已启用 VNC
![Add VM 菜单截图](https://d33wubrfki0l68.cloudfront.net/d366b2c17d8e8515c9b266ff5451d2b35413cca3/1e0fa/images/blog/vmsetupscreen.png)
- 点击下一步为虚拟机分配资源（见下方作者设置的截图，你可能需要根据需求更改资源）
![建议的虚拟机资源截图](https://d33wubrfki0l68.cloudfront.net/b96ec49a4ba0c3a5577d5f22275e31d7dbdebe52/81017/images/blog/dockerresourcesetup.png)
- 点击下一步进入磁盘设置
	-你需要创建一个新磁盘，以下是应使用的设置
	-磁盘类型：AHCI
	-Zvol 位置：tank/vm（或你的虚拟机存储所在的位置）
	-大小：至少 30 GB
![磁盘设置截图](https://d33wubrfki0l68.cloudfront.net/adb782ea4ec5531710e69bfefde641927ebdce00/a8cde/images/blog/dockerdisksetup.png)
-点击下一步进入网络接口（默认值即可，但请确保选择正确的网络适配器）
-点击下一步进入安装
	-浏览到你的 ubuntu ISO 文件（原作者和本文作者都使用 Ubuntu Server。此操作系统比其他一些操作系统占用资源更少，并且可以通过 VNC 或 SSH 访问以无头模式运行。你可以使用其他操作系统，但本指南是使用 Ubuntu Server 编写的）
-点击下一步，然后提交，你就创建好虚拟机了！
	-打开虚拟机，然后点击 VNC 打开 ubuntu
![虚拟机选项截图](https://d33wubrfki0l68.cloudfront.net/93d874e9630735f8a8d851a220b0411446149c6a/5deb3/images/blog/docketvmpage.png)
-启动后选择你的语言并完成安装程序
	-完成设置后，我们需要通过 SSH 登录 ubuntu 虚拟机来设置 Docker
	-打开 powershell 并输入 SSH "user"@(ip)（将 "user" 替换为你在操作系统安装时设置的用户）
	-如果提示，输入你的密码
	-关闭 VNC 控制台
	-回到 SSH 控制台，准备输入一些命令。按顺序输入以下命令：
	`sudo apt update`
	`sudo apt install apt-transport-https ca-certificates curl software-properties-common`
	`y`（如果出现提问）
	`curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`
	`sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"`
	`sudo apt update`
	`apt-cache policy docker-ce`
	-为了不必为每条 Docker 命令都使用 sudo，请运行以下命令
	`sudo usermod -aG docker ${USER}`
	`su - ${USER}`

### 2. 安装 Portainer
!!! 注意：默认情况下，Portainer Server 会通过 9443 端口暴露 UI，并通过 8000 端口暴露 TCP 隧道服务器。后者是可选的，仅在你计划将 Edge 计算功能与 Edge 代理一起使用时才需要。

-首先，创建 Portainer Server 用于存储其数据库的卷：
`docker volume create portainer_data`
-然后，下载并安装 Portainer Server 容器：
`docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest`
-Portainer Server 现已安装完成。你可以通过运行 `docker ps` 检查 Portainer Server 容器是否已启动
-安装完成后，你可以打开 Web 浏览器并访问以下地址来登录 Portainer Server 实例：
	`https://localhost:9443`
	-如有需要，将 `localhost` 替换为相关 IP 地址或 FQDN，如果你之前更改了端口，也请相应调整。
-你将看到 Portainer Server 的初始设置页面。
-创建你的第一个用户
	-你的第一个用户将是管理员。用户名默认为 admin，你可以根据需要更改。密码必须至少 12 个字符长，并满足所列的密码要求。
-将 Portainer 连接到你的环境。
	-管理员用户创建后，「Environment Wizard」将自动启动。该向导将帮助你开始使用 Portainer。
	-选择「Get Started」以使用 Portainer 运行所在的环境
![环境向导截图](https://2914113074-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FiZWHJxqQsgWYd9sI88sO%2Fuploads%2Fsig45vFliINvOKGKVStk%2F2.15-install-server-setup-wizard.png?alt=media&token=cd21d9e8-0632-40db-af9a-581365f98209)

### 3. 通过 Portainer Web Editor 安装 Tandoor Recipes
-从菜单中选择 Stacks，点击 Add stack，为堆栈指定一个描述性名称，然后选择 Web editor。
![堆栈列表截图](https://2914113074-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FiZWHJxqQsgWYd9sI88sO%2Fuploads%2FnBx62EIPhmUy1L0S1iKI%2F2.15-docker_add_stack_web_editor.gif?alt=media&token=c45c0151-9c15-4d79-b229-1a90a7a86b84)
-使用以下代码并将其输入到 Web Editor 中：

```yaml
version: "3"
services:
  db_recipes:
    restart: always
    image: postgres:16-alpine
    volumes:
      - ./postgresql:/var/lib/postgresql/data
    env_file:
      - stack.env

  web_recipes:
    image: vabene1111/recipes:latest
    env_file:
      - stack.env
    volumes:
      - staticfiles:/opt/recipes/staticfiles
      # Do not make this a bind mount, see https://docs.tandoor.dev/install/docker/#volumes-vs-bind-mounts
      - nginx_config:/opt/recipes/nginx/conf.d 
      - ./mediafiles:/opt/recipes/mediafiles
    depends_on:
      - db_recipes

  nginx_recipes:
    image: nginx:mainline-alpine
    restart: always
    ports:
      - 12008:80
    env_file:
      - stack.env
    depends_on:
      - web_recipes
    volumes:
      # Do not make this a bind mount, see https://docs.tandoor.dev/install/docker/#volumes-vs-bind-mounts
      - nginx_config:/etc/nginx/conf.d:ro
      - staticfiles:/static
      - ./mediafiles:/media

volumes:
  nginx_config:
  staticfiles:
```

-从[此处](https://raw.githubusercontent.com/vabene1111/recipes/develop/.env.template)下载 .env 模板，然后按下「Load Variables from .env File」按钮加载此文件：
![Add Stack 界面截图](https://www.portainer.io/hubfs/image-png-Feb-21-2022-06-21-15-88-PM.png)

-你需要更改以下变量：
	-`SECRET_KEY` 需要替换为新密钥。可以从 [Djecrety](https://djecrety.ir/) 等网站生成。
	-`TIMEZONE` 需要替换为适合你时区的代码。可接受的值可在 [TimezoneDB](https://timezonedb.com/time-zones) 找到
	-`POSTGRES_USER` 和 `POSTGRES_PASSWORD` 需要替换为你在 [PostgreSQL](https://www.postgresql.org/) 中的用户名和密码 !!!注意 不要使用社交媒体登录。你需要使用电子邮件和密码注册。
-更改这些变量后，你可以按下页面底部的 `Deploy the Stack` 按钮。这将创建运行 Tandoor Recipes 所需的容器。

### 4. 登录并设置你的新服务器！
- 你需要通过其网页访问 Tandoor Server：`https://localhost:xxxx`，将 `localhost` 替换为运行 Docker 的虚拟机 IP，将 `xxxx` 替换为你在上方 Web Editor 中为 `nginx_recipes` 选择的端口。在本例中为 `12008`。 
!!! 在容器启动并执行其所需操作期间，你可能仍会遇到 HTTP 错误，例如 500 或 502。请耐心等待，稍后再试
-现在你需要通过 WebGUI 设置 Tandoor Server。
