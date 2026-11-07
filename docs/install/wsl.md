!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。由于我无法亲自测试，欢迎随时提供反馈和改进建议。


!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

# 在 Windows（WSL）和 Docker Desktop 上安装 Ubuntu

从 https://docs.docker.com/desktop/install/windows-install/ 安装 Docker
在提示时，请务必在配置页面选择「Use WSL 2 instead of Hyper-V」选项

按照说明在 Docker 上安装 Tandoor。使用 Docker 的 Tandoor 安装说明来自 https://docs.tandoor.dev/install/docker/

如果你使用 Docker Desktop，可能会遇到以下错误：
/usr/bin/docker-credential-desktop.exe: Invalid argument

这表明 Docker Compose 无法获取拉取菜谱文件所需的身份验证凭据。

运行以下命令：
export DOCKER_CONFIG=/non-existent-directory

"non-existent-directory" 可以是你选择的任意目录。它可以是空的，
我们只是给 Docker 一个可指向的文件。你可以在以后创建凭据文件，为你的应用增加安全性。

运行 docker-compose up -d 命令后，你可能会遇到类似以下的错误：
fixing permissions on existing directory /var/lib/postgresql/data ... 2023-03-01T15:38:27.140501700Z chmod: /var/lib/postgresql/data: Operation not permitted

这表明 postgresql 用户 'postgres' 没有更改 /var/lib/postgresql/data 目录权限所需的权限。
注意：此问题在 Powershell 终端中不会出现，因此在 PowerShell 中安装 Tandoor 并使用 WSL 继续开发可能更容易。
修复此错误的步骤：
由于必须要在 Docker 容器内更改权限，我们需要创建一个在容器启动时立即运行的文件。该容器将在 db_recipes-1 容器启动之前更改 /var/lib/postgresql/data 目录的权限。此容器会设置数据库以接受连接。
Docker 允许我们在 docker-compose.yml 文件中设置 entrypoint。我们将在这里设置更改 postgres 用户权限的命令。
设置 entrypoint 文件的步骤：
1.	在与 docker-compose.yml 文件相同的目录中创建新文件 ‘docker-entrypoint.sh’。这将是一个 bash 文件。
2.	将以下命令添加到文件中
a.	#!/bin/sh（这称为 shebang。它告诉操作系统要使用的 shell，在此例中为 sh shell）
b.	chmod 777 /var/lib/postgresql/data（为所有用户授予该目录的读、写和执行权限，你可以根据需要更改这些权限）
c.	exec “@”（使用上述命令运行脚本）

当 docker-compose.yml 和 docker-entrypoint.sh 位于同一目录时，你的文件夹结构应如下所示：
![image](https://user-images.githubusercontent.com/100102599/225214709-322417a1-1cab-47a6-83dd-555a4234e72a.png)


docker-entrypoint.sh 文件应如下所示：
![image](https://user-images.githubusercontent.com/100102599/225214795-102c9e53-b790-498a-a6d6-ad0bcc980b2f.png)
 
3.	打开 docker-compose.yml 文件
4.	为 db_recipes 服务添加 entrypoint 配置
entrypoint:
-	docker-entrypoint.sh
此命令确保在 db_recipes 服务启动之前先运行 docker-entrypoint.sh 文件。借此，我们在需要之前设置数据库用户权限，从而消除该错误。
你的 docker-compose.yml 文件应如下所示：
![image](https://user-images.githubusercontent.com/100102599/225214865-869c9b24-61cf-4069-aa98-a7e18a165105.png)
 
5.	运行 docker-compose up -d，所有容器都应该运行起来！
