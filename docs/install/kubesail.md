!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

[KubeSail](https://kubesail.com/) 通过提供用于安装和管理应用的简单 Web 界面，让你可以安装 Tandoor。你可以连接任何运行 Kubernetes 的服务器，或获取预配置的 [PiBox](https://pibox.io)。

<!-- A portion of every PiBox sale goes toward supporting Tandoor development. -->

KubeSail 模板在很大程度上基于 [Kubernetes 安装](kubernetes.md)配置

## 快速开始

加载 [Tandoor Recipes](https://kubesail.com/template/PastuDan/Tandoor%20Recipes) 模板，然后点击 **Launch Template**。

如果你尚未将服务器连接到 KubeSail，请参阅 KubeSail 文档中的[获取集群](https://docs.kubesail.com/guides/bare-metal/)部分。

## 重要说明

在「Template Variables」部分，你会看到两个输入字段。它们应显示 `RANDOM(16)`，表示在启动模板时它们会被随机生成并专门用于你的安装。如果你更愿意自行设置，可以在启动模板前输入。

![image](https://user-images.githubusercontent.com/1296162/140431276-b823ba1c-175c-436a-9ed9-35bc62f8744e.png)
