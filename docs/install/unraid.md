!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

[Unraid](https://unraid.net/) 是一款可让你轻松安装和设置应用程序的操作系统。

感谢 [CorneliousJD](https://github.com/CorneliousJD)，使用 unraid 可以轻松安装此应用。
更多详情请查看 [Issue #184](https://github.com/vabene1111/recipes/issues/184)。
unraid 论坛上还有[一个讨论帖](https://forums.unraid.net/topic/98179-support-recipes-corneliousjd-repo/)，他提供了额外信息。

## 安装

### 安装 Community Applications

适用于 unRAID 的 Tandoor 可通过 `Community Applications` 获取。
你首先需要通过以下位置的说明安装 `Community Applications (CA)`：
[Unraid 论坛](https://forums.unraid.net/topic/38582-plug-in-community-applications/)

### 找到并安装 Tandoor Recipes

之后，你可以转到 unRAID 中的「Apps」标签页，搜索 `Tandoor Recipes`，找到正确的容器并安装它。 
![image](https://user-images.githubusercontent.com/724777/111038251-faa0cb00-83f5-11eb-9807-37815de8d795.png)

### 配置设置

对大多数用户来说，默认设置应该没问题，只需确保输入一个随机生成的密钥。
然后点击 `Apply`。
![image](https://user-images.githubusercontent.com/724777/97094856-f3377b80-1626-11eb-98d5-e4b871a420f0.png)

### 访问网站

容器安装完成后，点击 `Tandoor Recipes` 图标并点击 WebUI 按钮以启动 Web 用户界面。
如有需要，可将容器设置为自动启动。 
![image](https://user-images.githubusercontent.com/724777/111038276-16a46c80-83f6-11eb-866b-b3bc9a2efb87.png)
