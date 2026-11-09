更新流程取决于您选择的[安装](/install/docker)方式

更新时可以跳过中间的若干版本，但请务必
**阅读发行说明**，以防某些更新需要执行特殊操作。

## Docker
对于所有使用 Docker 的部署方式，更新流程大致如下

0. 更新前建议先**创建[备份](/system/backup)！**
1. 使用 `docker compose down` 停止容器
2. 使用 `docker compose pull` 拉取最新镜像
3. 使用 `docker compose up -d` 重新启动容器

## 手动安装

对于所有手动安装的部署方式，更新通常需要从 GitHub 下载最新的源代码。
之后请确保运行：

1. `pip install -r requirements.txt`
2. `manage.py collectstatic`
3. `manage.py migrate`
4. `cd ./vue`
5. `yarn install`
6. `yarn build`

以安装最新的依赖库、应用所有新的迁移并收集新的静态文件。

## PostgreSQL

当您更改版本时，Postgres 不会自动升级数据库文件，需要手动干预。
一种选择是手动[备份/恢复](updating.md)数据库。

升级数据库的完整选项列表见 [PostgreSQL 官方文档](https://www.postgresql.org/docs/current/upgrading.html)。

1.  收集有关您的环境的信息。

``` bash
grep -E 'POSTGRES|DATABASE' ~/.docker/compose/.env
docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}' | awk 'NR == 1 || /postgres/ || /recipes/'
```

2. 导出 tandoor 数据库

``` bash
docker exec -t {{database_container}} pg_dumpall -U {{djangouser}} > ~/tandoor.sql
```

3. 停止 tandoor 应用
``` bash
docker compose down
```

4. 重命名 tandoor 卷

``` bash
mv ./postgresql ./postgresql.old
```

5. 更新 docker-compose.yaml 中 postgres 容器的镜像标签

``` yaml
db_recipes:
  restart: always
  image: postgres:16-alpine
  volumes:
    - ./postgresql:/var/lib/postgresql/data
  env_file:
    - ./.env
```

6. 拉取并重建数据库容器

``` bash
docker compose pull && docker compose up -d db_recipes
```

7. 导入数据库导出文件

``` bash
cat ~/tandoor.sql | docker exec -i {{database_container}} psql postgres -U {{djangouser}}
```

8. 安装 postgres 扩展
``` bash
docker exec -it {{database_container}} psql postgres -U {{djangouser}}
```
  然后
``` psql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

如果任何一步失败，请回到旧的 postgres 版本和数据目录后重试。

网上有许多文章和工具可以作为升级的良好起点 [1](https://thomasbandt.com/postgres-docker-major-version-upgrade)、[2](https://github.com/tianon/docker-postgres-upgrade)、[3](https://github.com/vabene1111/DockerPostgresBackups)。
