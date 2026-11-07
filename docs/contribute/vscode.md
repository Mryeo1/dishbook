调试 django、volar、测试、代码检查和格式化的配置都包含在项目文件中。

## 扩展

可以将 VSCode 配置为在保存时进行格式化和代码检查，而不必在提交 PR 之前手动格式化文件。
要启用自动格式化和代码检查，请在 VSCode 中安装以下扩展：

名称：Flake8
发布者：Microsoft
VS Marketplace 链接：https://marketplace.visualstudio.com/items?itemName=ms-python.flake8

名称：yapf
发布者：EeyoreLee
VS Marketplace 链接：https://marketplace.visualstudio.com/items?itemName=eeyore.yapf

名称：isort
发布者：Microsoft
VS Marketplace 链接：https://marketplace.visualstudio.com/items?itemName=ms-python.isort

名称：Vue - Official
发布者：Vue
VS Marketplace 链接：https://marketplace.visualstudio.com/items?itemName=Vue.volar

名称：Prettier - Code formatter
发布者：Prettier
VS Marketplace 链接：https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

<!-- prettier-ignore -->
!!! hint
    在列表末尾添加一个逗号会触发 yapf 将列表的每个元素放到新的一行

## VSCode 任务

<!-- prettier-ignore -->
!!! note
    为了热重载 vue，必须在启动 django 服务器之前启动 `yarn dev` 服务器。

有许多内置任务可供使用。以下是一些关键任务：

- `Setup Dev Server` - 运行所有前置步骤，以便能在 VSCode 内运行开发服务器。
- `Setup Tests` - 运行所有前置步骤，以便能在 VSCode 内运行测试。

运行这些任务后，有两种选择。如果你想以热重载模式运行 vue3 服务器以便快速开发前端，应当运行开发用 vue 服务器：

- `Yarn Dev` - 运行未连接到 VSCode 的开发用 Vue.js vite 服务器。如果你想修改 Vue 并实时查看效果，这会很有用。

如果不需要，你需要构建前端并将其复制到 django 服务器上。如果你更改了前端，需要重新运行此任务并重启 django 服务器：

- `Collect Static Files` - 构建并收集 vue3 前端，以便能通过 django 服务器提供。

完成上述任一步骤后，你就可以启动 django 服务器：

- `Run Dev Server` - 运行未连接到 VSCode 的 django 开发服务器。

此外还指定了其他几个任务，以备你有特定的开发需求：

- `Run all pytests` - 在 VSCode 之外运行所有 pytest 测试。
- `Serve Documentation` - 运行文档服务器。如果你想查看文档更改的显示效果，这会很有用。
