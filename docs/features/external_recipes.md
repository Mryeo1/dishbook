本应用最初的目的，是为我大量 PDF 扫描版菜谱提供检索界面。
该功能现在称为「外部菜谱」。

<!-- prettier-ignore -->
!!! info
    内部菜谱以结构化的方式存储在数据库中。它们可以通过标准化界面展示，
    并支持购物清单、份量缩放和步骤等功能。
    外部菜谱本质上是展示在界面中的文件。其好处在于，你可以快速导入
    全部旧菜谱，再逐一转换。

要使用外部菜谱，首先需要配置一个存储源。之后可以创建一个同步路径。
最后，你需要与外部路径同步，并导入你想要的菜谱。

## 存储

<!-- prettier-ignore -->
!!! danger
    为了让本应用从外部提供商获取数据，它需要存储身份验证信息。
    请尽可能使用只读或独立账户，或使用应用密码。
    有更好的做法，但目前尚未实现。

`Storage Backend` 是一个远程存储位置，文件从其中**读取**。
要添加新的后端，请点击 `username >> External Recipes >> Manage External Storage >> the + next to Storage Backend List`。
然后在那里点击加号按钮。

所有提供商的基本配置都是相同的。

| 字段   | 值                                                                   |
| ------ | -------------------------------------------------------------------- |
| 名称   | 你为此存储源设置的标识符，可以是任意内容。                           |
| 方法   | 期望使用的方法。                                                     |

<!-- prettier-ignore -->
!!! success
    目前仅实现了下面列出的提供商。如果你需要其他提供商，欢迎提交
    issue 或 pull request。

### 本地

<!-- prettier-ignore -->
!!! info
    目前无法通过 Web 界面上传文件。这可能是后续会添加的功能。

本地提供商不需要任何配置（用户名、密码、令牌或 URL）。
对于监控项，你需要在宿主机上定义一个有效路径。（路径）
路径取决于你的部署方式，可以是相对路径，也可以是绝对路径。

<!-- prettier-ignore -->
!!! warning "卷"
    默认情况下，除媒体文件和数据库外，不会持久化其他数据。如果你使用本地提供商，
    请确保将你选择监控的路径挂载到宿主机，以保持其持久化。

#### Docker

如果你使用 Docker，默认目录为 `/opt/recipes/`。
添加

```
      - ./externalfiles:/opt/recipes/externalfiles
```

到你的 docker-compose.yml 文件中 `web_recipes >> volumes` 区块下。这会在你的 Docker 目录中创建一个名为 `externalfiles` 的文件夹，你可以选择在其中存放外部 PDF（当然也可以存放在任意位置，只需将 `./externalfiles` 改为你喜欢的位置）。
保存 docker-compose.yml 并重启 Docker 容器。

### Dropbox

| 字段     | 值                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| 用户名   | Dropbox 用户名                                                                                                    |
| 令牌     | Dropbox API 令牌。可在[此处](https://dropbox.github.io/dropbox-api-v2-explorer/#auth_token/from_oauth1)找到        |

### Nextcloud

<!-- prettier-ignore -->
!!! warning "路径"
    看起来正确的 WebDAV 路径因安装而异（无论出于什么原因）。
    在 Nextcloud Web 界面中点击左下角的 `Settings` 按钮，那里会显示你的 WebDAV URL。

| 字段     | 值                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 用户名   | Nextcloud 用户名                                                                                                                                   |
| 密码     | Nextcloud 应用密码                                                                                                                                 |
| Url      | Nextcloud 服务器 URL（例如 `https://cloud.mydomain.com`）                                                                                          |
| 路径     | （可选）webdav 路径（例如 `/remote.php/dav/files/vabene1111`）。如果未提供路径，将使用 `/remote.php/dav/files/` 加上你的用户名。                  |

## 添加外部菜谱

要将存储后端中的新路径添加到同步列表，请前往 `username >> External Recipes`，
并选择你想要使用的存储后端。
然后输入你希望从存储根目录开始监控的路径（例如 `/Folder/RecipesFolder`，或上面 Docker 示例中的 `/opt/recipes/externalfiles`），并保存。

## 同步数据

要将菜谱应用与存储后端同步，请在 `username >> External Recipes` 下按 `Sync now`

## 发现的菜谱

同步找到的所有文件都可以在 `Manage Data >> Discovered recipes` 下找到。
你可以在那里一次性导入全部而不做修改，也可以逐个导入，并在导入时添加标签。

