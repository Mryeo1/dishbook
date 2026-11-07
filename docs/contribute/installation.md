!!! info "开发环境搭建"
    开发环境的搭建有些杂乱，因为这个应用结合了 Django 和 Vue.js 两者（至少在我看来）最好的部分。

### Devcontainer 搭建

我们配置了一个 [devcontainer](https://containers.dev) 来简化开发。它针对 VSCode 做了优化，但也应该可以
供其他编辑器使用。容器运行后，你可以做诸如启动 Django 开发服务器、启动 Vue.js
开发服务器、运行 python 测试等事情，方式可以是使用下面的 VSCode 任务，或手动运行各个
技术小节中描述的命令。

在 VSCode 中，只需检出该 git 仓库，然后通过命令面板选择 `Dev Containers: Reopen in container`。

如果你需要更改 python 依赖（requierments.txt）或操作系统软件包，则需要重新构建容器。如果你
更改操作系统软件包要求，则需要同时更新主 `Dockerfile` 和 `.devcontainer/Dockerfile`。

### Django

本应用使用 Python 的 Django 框架开发。他们提供了非常出色的
入门[文档](https://www.djangoproject.com/start/)，所以我这里只介绍基础知识。

1. 将本仓库克隆到任意位置，并为你的操作系统安装 Python 语言（我推荐使用 3.10 或更高版本）。
2. 在你喜欢的编辑器/IDE（例如 PyCharm）中打开它。
   a. 如果需要，为所有软件包创建一个虚拟环境。
3. 安装所有必需的软件包：`pip install -r requirements.txt`。
4. 运行迁移：`python manage.py migrate`。
5. 启动开发服务器：`python manage.py runserver`。

**无需**设置任何环境变量。默认情况下会使用一个简单的 SQLite 数据库，所有设置都由
默认值填充。

### Vue.js

!!! danger "开发环境搭建"
    **必须**在运行 django runserver 命令之前启动 vite 开发服务器，否则 django 将**不会**识别它，并会尝试回退到构建文件。

前端使用 [Vue.js](https://vuejs.org/) 构建。

为了在这些页面上进行开发，你需要安装一个自选的 Javascript 包管理器。以下示例使用 yarn。

1. 进入 `vue3` 并运行 `yarn install` 以安装依赖  
2. 运行 `yarn serve` 启动开发服务器，它支持热重载，便于快速轻松地开发

如果你不想在这些页面上进行开发，而是希望应用在开发期间正常运行，请运行一次 `yarn build` 来构建前端页面。之后你
可能需要运行 `python manage.py collectstatic` 来设置静态文件。


### 从源码构建 Docker 镜像
与 Vue.js 的流程类似，如果你想从源码构建 docker 镜像，必须先构建 vue3 文件。

1. 在你的项目文件中进入 `vue3` 并运行 `yarn install` 以安装依赖
2. 运行 `yarn build` 构建供 django 使用的静态文件。
3. 返回根目录并运行 `docker build -t ${tag}:${version} .`

在这种情况下不需要 Django 的 `collectstatic` 命令，因为 `Dockerfile` 的入口点会在 `docker run` 启动时收集静态文件。
