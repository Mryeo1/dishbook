!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。由于我无法亲自测试，欢迎随时提供反馈和改进建议。

## **说明**

在群晖 NAS 上设置 `vabenee1111/recipes` Docker 容器的基本指南。

### 1. 准备工作
- 通过浏览器登录群晖 DSM
- 通过套件中心安装 `Container Manager`
- 通过套件中心安装 `Text Editor`（如果你不在本地先编辑 `.env`，则需要用它来编辑）
- 如果你的 File Station 中还没有共享的 `docker` 文件夹，请在卷的根目录创建一个。 
- 在 `volume1/docker` 文件夹内创建 `recipes` 文件夹。 
- 在其中创建必要的文件夹结构。你需要以下文件夹：

```
volume1/docker/
├─ recipes/
│  ├─ postgresql/
│  ├─ mediafiles/
│  ├─ staticfiles/
│  ├─ nginx_config/
```

### 2. `.env` 与 `docker-compose.yml`
!!!info 本指南使用 `plain` 设置。

- 打开 [.env 模板](https://github.com/vabene1111/recipes/blob/develop/.env.template)
  - 复制文本并将其作为 `.env.txt` 保存到你的 recipes 文件夹（.txt 扩展名允许你修改它）
  - 使用 Text Editor 打开该文件。填写必要字段，例如 `SECRET_KEY` 和 `POSTGRES_PASSWORD`。 
  - 保存文件，然后将其重命名为 `.env`（去掉 .txt 扩展名） 
- 打开 [docker-compose.yml 模板](https://raw.githubusercontent.com/TandoorRecipes/recipes/refs/heads/develop/docs/install/docker/plain/docker-compose.yml)
  - 复制文本，然后继续阅读。 

### 3. 创建容器
- 在 DSM 中，打开 `Container Manager`。点击 `Project`。 
- 点击 `Create` 创建新项目。填写以下字段： 
  - `Name`：`tandoor_recipes` 或类似名称。 
  - `Path`：选择你的 `recipes` 文件夹。如果你一直按步骤操作，则为 `/docker/recipes`
  - `Source`：选择 `Create docker-compose.yml`。将出现一个文本框。 

### 4. 编辑 docker-compose.yml
- 将 `docker-compose.yml` 粘贴到 `source` 文本框中。 
- 该文件告诉 Docker 如何设置 recipes。Docker 会为 recipes 运行创建两个容器：`web_recipes` 和 `db_recipes`。它们都是必需的，并且需要通过你之前创建的文件夹来存储和共享数据。
- 在 `web_recipes` 部分下，你可以添加 `ports`。此行指定哪个群晖外部端口将指向哪个 Docker 内部端口。选择一个空闲端口并使用它替换第一个数字。你将通过浏览 http://your.synology.ip:chosen.port 来打开 recipes，例如 http://192.168.1.1:2000
- 如果你想使用 2000 端口，应将 `ports` 编辑为 `2000:80`
	```
	ports:
		- "2000:80"
 	```

### 5. 完成
- 点击 `Next`。 
- 群晖会带你进入 `web portal settings` 页面。点击 `Next` 跳过此页面。 
  - 如果你启用此选项，容器将无法构建，因为你指定的端口会被 Web 服务占用。容器已自带配置好用于提供文件的 nginx，因此你不需要 `web portal settings`。 
- 你将看到 `Summary` 页面。检查后点击 `Done`。 
- 项目将开始构建并应能完成。 
	```bash
	Container recipes-db_recipes-1 Starting
	Container recipes-db_recipes-1 Started
	Container recipes-web_recipes-1 Starting
	Container recipes-web_recipes-1 Started
	Exit Code: 0
	```
  - 如果出现错误，请查看错误并修复。失败的一个常见原因是你没有创建第 1 步目录树中指定的文件夹。
- 如果你发现 `web_recipes` 无法连接数据库，可能是防火墙配置有误，请参阅下一节。
- 浏览至 192.168.1.1:2000 或你的 IP 和端口

### 6. 防火墙
你需要设置防火墙规则，以便 `recipes_web` 容器能够连接到 `recipes_db` 容器。

- 控制面板 -> 安全性 -> 防火墙 -> 编辑规则 -> 创建
	-  端口：全部
 		-  如果你只想允许数据库端口 5432，你需要创建 2 条规则以允许入站和出站端口（最终还可能更严格地指定 IP）
	-  源 IP：特定 IP -> 选择 -> 子网
		- 输入 Docker 网络 IP（可在 Docker 应用的网络标签页中找到）
		- 示例：IP 地址：172.18.0.0，子网掩码/前缀长度：255.255.255.0
	-  操作：允许
- 保存并确保它位于拒绝规则之上
- 如果你想跳过通过反向代理进行 SSL 设置，你还需要允许访问用于暴露容器的端口（例如本例中的 2000）。
	-  端口：2000
	-  来源：取决于访问范围应有多宽
	-  操作：允许

### 7. 附加 SSL 设置
最简单的方法是通过反向代理进行。

- 控制面板 -> 登录门户 -> 高级 -> 反向代理
- 创建
	- 输入名称
	- 源：
		- 协议：HTTPS
		- 主机名：如果从外部访问则为 URL，否则为网络中的 IP
		- 端口：你想要访问的端口，必须与 docker-compose 文件中的端口不同
		- 可以启用 HSTS
	- 目标：
		- 协议：HTTP
		- 主机名：localhost
		- 端口：docker-compose 文件中的端口
	- 点击自定义标头，然后按创建 -> WebSocket
	- 保存
- 控制面板 -> 安全性 -> 防火墙 -> 编辑规则 -> 创建
	- 端口：从内置应用程序列表中选择 -> 选择 -> 找到你的反向代理，启用它
	- 源 IP：视情况而定，全部允许从外部访问，我使用特定 IP 以便仅在我的网络中连接
	- 操作：允许
- 保存并确保它位于拒绝规则之上
	
### 8. 已弃用的指南

以下是较旧的指南，如果你运行的是旧版本 DSM，它们可能会有用。 

- 以下文档由 
@therealschimmi 在[此问题讨论](https://github.com/vabene1111/recipes/issues/98#issuecomment-643062907)中提供。

- 还有这份 
([word](https://github.com/vabene1111/recipes/files/6708738/Tandoor.on.a.Synology.Disk.Station.docx), 
[pdf](https://github.com/vabene1111/recipes/files/6901601/Tandoor.on.a.Synology.Disk.Station.pdf)) 由 @DiversityBug 提供的极好且非常详细的指南。
