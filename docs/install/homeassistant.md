!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。
    非常感谢 [alexbelgium](https://github.com/alexbelgium) 为实现让 Tandoor 在 HA 中运行所需的一切所做的工作。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

![Addon version](https://img.shields.io/badge/dynamic/json?label=Version&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Falexbelgium%2Fhassio-addons%2Fmaster%2Ftandoor_recipes%2Fconfig.json) ![Last update](https://img.shields.io/badge/dynamic/json?label=Updated&query=%24.last_update&url=https%3A%2F%2Fraw.githubusercontent.com%2Falexbelgium%2Fhassio-addons%2Fmaster%2Ftandoor_recipes%2Fupdater.json) ![aarch64][aarch64-badge] ![amd64][amd64-badge] ![armv7][armv7-badge]

### 简介
[Home Assistant (HA)](https://www.home-assistant.io/) 是一款免费开源的智能家居自动化软件，旨在成为智能家居设备的中央控制系统，注重本地控制与隐私。你可以通过 Android 和 iOS 配套应用访问基于 Web 的用户界面，或通过受支持的虚拟助手（如 Google Assistant 或 Amazon Alexa）以语音命令访问。

它可以作为独立操作系统[安装](https://www.home-assistant.io/installation/)在专用系统上，通过空中下载（OTA）更新即可轻松部署和维护。它也可以作为 Docker 容器安装。

除了丰富的原生功能外，还可以添加模块化附加组件来扩展功能。已创建了 Tandoor Recipes 的附加组件，可将服务器存储在 Home Assistant 设备上，并通过直接 Web 访问或通过原生 Home Assistant 应用安全地访问用户界面。

### 安装

1. 当你的 Home Assistant 系统运行后，下一步是将 [alexbelgium](https://github.com/alexbelgium) 的自定义仓库添加到系统中。点击下方按钮并填写你的 HA 网址即可完成。[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Falexbelgium%2Fhassio-addons)
2. 安装附加组件 [![Install the addon](https://my.home-assistant.io/badges/supervisor_store.svg)](https://my.home-assistant.io/redirect/supervisor_store)
3. 按你的偏好设置附加组件选项（见下文）
4. 启动附加组件
5. 查看附加组件的日志，确认一切正常。
6. 打开 webUI（通过 Ingress，或直接访问 http://homeassistant.local:9928），并调整软件选项

### 配置

以下环境变量可通过附加组件选项配置。关于如何填写这些变量，请参阅 [Docker 文档](docker.md)。

```yaml
Required :
    "ALLOWED_HOSTS": "your system url", # You need to input your homeassistant urls (comma separated, without space) to allow ingress to work
    "DB_TYPE": "list(sqlite|postgresql_external|mariadb_addon)" # Type of database to use. Mariadb_addon allows to be automatically configured if the maria_db addon is already installed on your system. Sqlite is an internal database. For postgresql_external, you'll need to fill the below settings
    "SECRET_KEY": "str", # Your secret key
    "PORT": 9928 # By default, the webui is available on http://homeassistant.local:9928. If you ever need to change the port, you should never do it within the app, but only through this option
Optional :
    "POSTGRES_HOST": "str?", # Needed for postgresql_external
    "POSTGRES_PORT": "str?", # Needed for postgresql_external
    "POSTGRES_USER": "str?", # Needed for postgresql_external
    "POSTGRES_PASSWORD": "str?", # Needed for postgresql_external
    "POSTGRES_DB": "str?" # Needed for postgresql_external
```

### 更新与备份

alexbelgium 的仓库包含一个脚本，每 3 天将附加组件与已发布的容器同步一次。只需等待几个小时，让 HA 刷新其仓库列表，更新就会自动在你的 HA 系统中提示。

建议经常备份。所有数据都存储在附加组件之外，主要位置为 `/config/addons_config/tandoor_recipes`，因此更新时除了备份附加组件本身，还要确保备份此文件夹。如果你选择 mariadb 作为数据库选项，别忘了也备份它。

### 支持

与附加组件本身相关的问题应提交到[维护者仓库][repository]。

与 HA 相关的问题应提交到 [HA 社区论坛][forum]。

与 Tandoor Recipes 相关的问题应提交到本 GitHub 仓库。

[aarch64-badge]: https://img.shields.io/badge/aarch64-yes-green.svg?logo=arm
[amd64-badge]: https://img.shields.io/badge/amd64-yes-green.svg?logo=amd
[armv7-badge]: https://img.shields.io/badge/armv7-yes-green.svg?logo=arm
[forum]: https://community.home-assistant.io/t/my-custom-repo
[repository]: https://github.com/alexbelgium/hassio-addons
