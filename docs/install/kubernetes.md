!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

## K8s 设置

这是一套足以用于生产环境的设置。请务必替换默认密钥！你可以在 GitHub 上[此处](https://github.com/MyDigitalLife/recipes/tree/fix-k8s-documentation/docs/install/k8s)找到示例文件。

## 文件

### 10-configmap.yaml

nginx 配置映射。它会作为 nginx.conf 加载到 nginx sidecar 中，用于配置 nginx 提供静态内容。

### 15-secrets.yaml

!!! warning "包含密钥"
    **替换它们！**

此文件仅用于快速开始。请注意，安装后更改密钥会很麻烦，本文档未作说明。**你应当在安装前设置新的密钥。** 毕竟你是在安装**之前**阅读本文档 ;-)

创建你自己的 postgresql 密码以及 Django 应用的密钥。

另请参阅[使用 kubectl 管理密钥](https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-kubectl/)

**将** `db-password`、`postgres-user-password` 和 `secret-key` **替换为某个——嗯——保密的东西 :-)**

~~~
echo -n 'db-password' > ./db-password.txt
echo -n 'postgres-user-password' > ./postgres-password.txt
echo -n 'secret-key' | sha256sum | awk '{ printf $1 }' > ./secret-key.txt
~~~

删除默认的密钥文件 `15-secrets.yaml`，并根据你的文件生成 K8s 密钥。

~~~
kubectl create secret generic recipes \
  --from-file=postgresql-password=./db-password.txt \
  --from-file=postgresql-postgres-password=./postgres-password.txt \
  --from-file=secret-key=./secret-key.txt
~~~

### 20-service-account.yml

为 Deployment 和 StatefulSet 创建服务账户 `recipes`。

###  30-pvc.yaml

为媒体和静态内容创建持久卷声明。你可能希望增大容量。这需要已安装存储类。

### 40-sts-postgresql.yaml

基于 bitnami 镜像的 PostgreSQL StatefulSet。它会以 root 身份运行一个初始化容器来做准备工作。postgres 容器本身以较低权限的用户运行。菜谱应用使用数据库超级用户（postgres），因为菜谱应用在启动时会执行一些数据库迁移，这需要超级用户权限。

### 45-service-db.yaml

创建数据库服务。

### 50-deployment.yaml

该 Deployment 首先启动一个初始化容器来执行数据库迁移和文件修改。此初始化容器以 root 身份运行。初始化容器运行来自 `vabene1111/recipes` 镜像的 [boot.sh](https://github.com/TandoorRecipes/recipes/blob/develop/boot.sh) 脚本的一部分。

随后该 Deployment 运行两个容器：recipes-nginx 和运行 gunicorn 应用的 recipes 容器。nginx 容器通过配置映射获取其 nginx.conf，以提供静态内容 `/static` 和 `/media`。gunicorn 容器从密钥 `recipes` 获取其密钥和数据库密码。`gunicorn` 以用户 `nobody` 运行。

目前，该 Deployment 使用 `latest` 镜像。你可能希望显式指定标签，例如

~~~
image: vabene1111/recipes:1.4.7
~~~

在初始化容器 `init-chmod-data` 和主 `recipes` 容器中使用**同一个镜像**是**极其重要的**。

### 60-service.yaml

创建应用服务。

### 70-ingress.yaml

为 recipes 服务设置 ingress。对静态内容 `/static` 和 `/media` 的请求会发送到 nginx 容器，其他所有请求则发送到 gunicorn。已准备好通过 cert-manager 进行 TLS 设置。你必须将**主机名**从 `recipes.local` **更改为**你的具体域名。

## 结论

总而言之：

- 数据库以 StatefulSet 形式设置。
- 数据库容器以低权限用户运行。
- 数据库和应用使用密钥。
- 应用同样以低权限用户运行。
- nginx 以 root 运行，但派生出的子进程使用低权限用户。
- 有一条 ingress 规则可从外部访问应用。

我用 [kind](https://kind.sigs.k8s.io/) 尝试了这套设置，它在我的本地集群上运行良好。

当你以超级用户身份检查系统时，会出现一个警告：

!!! warning "媒体服务警告"
    不建议直接使用 gunicorn/python 提供媒体文件！请按照此处描述的步骤更新你的安装。

我不知道这个检查是如何工作的，但这个警告完全是错的！;-) 媒体和静态文件由 ingress 路由到 nginx 容器——我保证 :-)

## 更新

这些清单已针对多个发行版进行测试。较新的版本可能需要进行更改才能正常工作。

如果一切按预期工作，`init-chmod-data` 初始化容器会执行数据库迁移，更新过程是透明的。不过，建议使用特定标签以提高稳定性并避免不必要的迁移。

## 应用清单

要使用 kubectl 应用清单，请使用以下命令：

~~~
kubectl apply -f ./docs/install/k8s/
~~~
