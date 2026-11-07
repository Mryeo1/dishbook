!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

## Helm 安装设置

前提条件：

1. 你有一个可访问且正在运行的 postgres 数据库。
2. 该 Chart 的初始版本不包含负载均衡器（LB）。它假定你将通过 Ingress 清单或 httproute 指向将要创建的服务。

示例配置 values.yaml。请查看 helm-chart 仓库以获取最新[版本](https://github.com/csg33k/helm-charts/blob/main/charts/tandoor/values.yaml)。

基本最小示例：

**values.yaml**
```yaml
## these are not needed but I'm setting them so they're consistent with my env. The routes I give assume these settings.
namespaceOverride: food
fullnameOverride: "recipes"


Change to latest version if out of date.
#global:
#  create_namespace: false
#  image: vabene1111/recipes
#  tandoor_version: 2.3

# Environment variables
env: 
## Values below will get you to a basic working installation
  - name: DB_ENGINE
    value: django.db.backends.postgresql
  - name: POSTGRES_HOST
    value: shared-rw.postgres-operator.svc.cluster.local
  - name: POSTGRES_PORT
    value: "5432"
  - name: POSTGRES_DB
    value: fooddb
  - name: SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: recipes-secrets
        key: secret-key
  - name: POSTGRES_USER
    valueFrom:
      secretKeyRef:
        name: recipes-secrets
        key: username
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: recipes-secrets
        key: password
## I skipped email support but feel free to add it as well. 

# Persistent Volume Claims, is not strictly required but it's highly recommended
# to create a few volumes to persist your data. Otherwise those files would reboot
# on each pod restart.
persistence:
  enabled: true
  volumes:
    - name: staticfiles
      mountPath: /opt/recipes/staticfiles
      size: 1Gi
    - name: mediafiles
      mountPath: /opt/recipes/mediafiles
      size: 1Gi

## In Production, use a different way of getting the secrets in. unless this code never leaves your server.
## In a "Prod" like homelab you should use ESO or Sealed Secrets, etc populate these values.
extraResources:
  - apiVersion: v1
    kind: Secret
    metadata:
      name: recipes-secrets
      namespace: food
    type: Opaque
    stringData:
      password: superSecretDBPass
      secret-key: ## output of openssl rand -base64 32 | tr -d '/+=' | head -c 32 
      username: db_username
```

安装 Chart：

```sh
helm install recipe-manager -n food oci://ghcr.io/csg33k/helm-charts/tandoor --version 0.0.1 -f myvalues.yaml 
```

完成之后，你只需设置 Ingress / httproute。每个人的做法不同，但如果你已经设置好 Gateway，设置路由就和下面一样简单：

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: food-https
  namespace: food
spec:
  parentRefs:
    - name: http-gateway ## Change this
      namespace: default  ## Change this
      sectionName: https
  hostnames:
    - food.domain.tld ## Change this
  rules:
    - backendRefs:
        - name: recipes ## If the name is different for your env, update it accordingly.
          port: 80
```

就这样！烹饪愉快！
~~~
