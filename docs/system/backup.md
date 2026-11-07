目前应用本身并没有实现「好」的备份方式。
这意味着备份数据将由您自己负责。

计划加入一个「真正」的备份功能，类似 HomeAssistant 这类应用：可以在 Web 界面中
下载和恢复快照。

!!! warning
    制定新的备份策略时，请务必同时测试恢复流程！

## 数据库
请使用任何标准的数据库备份方式。对大多数系统而言，可以使用 dump
命令生成包含全部所需数据的 SQL 文件。

请参阅您所用数据库系统的文档。

我个人使用自己编写的一个[小脚本](https://github.com/vabene1111/DockerPostgresBackups)，从 postgresql 数据库自动拉取 SQL 转储。
它**既**没有经过充分测试，也**没有**完善文档，请自行承担使用风险。
我建议只把它作为您自己备份策略的起点。

## 媒体文件
除数据库之外，本应用唯一存储的数据就是菜谱中使用的媒体文件（例如图片）。

它们位于挂载的媒体文件目录中（取决于您的安装方式）。

要备份这些文件，只需将它们复制到别处。恢复时反向操作即可。

文件名的格式为 `<random uuid4>_<recipe_id>`。万一您搞砸得很严重，这有助于恢复数据。

## 从 Docker 构建进行手动备份
Tandoor 的标准 Docker 构建使用 postgresql 作为后端数据库。可以使用名为「dumpall」的功能对其进行备份。它会生成一个 .SQL 文件，其中包含供 postgresql 服务器重建数据库使用的命令列表。您还需要单独备份媒体文件。

完整复制 Docker 目录也可以作为一种备份方式，但前提是您确定恢复时会使用相同的硬件、操作系统和 postgresql 版本。否则，不同版本的 postgresql 将无法与现有表兼容。
即使 Tandoor 容器出现故障，只要 postgresql 数据库已成功启动，您仍然可以从 Docker 进行备份。使用此备份方式时，请确认菜谱已成功导入。有用户反映，第一次尝试时只导入了标题和图片，需要再次运行导入命令。

以下命令假设您的 docker-compose 文件位于名为「docker」的文件夹中。请将「docker_db_recipes_1」替换为您的 db 容器名称。这些命令还假设您使用 pgdump.sql 作为备份文件名。建议在文件名中包含日期，以免后续备份被删除。
备份：
```
sudo docker exec -t docker_db_recipes_1 pg_dumpall -U djangouser > pgdump.sql

```

恢复：
```
cat pgdump.sql | sudo docker exec -i docker_db_recipes_1 psql postgres -U djangouser

```
此命令连接的是 postgres 数据库而非实际的 djangodb 数据库，因为导入功能需要删除该表，而您在连接该表时无法将其删除。

## 使用导出和导入进行备份
现在您可以使用导出功能从 Tandoor 导出菜谱。此方式需要有可用的 Web 界面。
1. 点击一个菜谱
2. 点击三个点图标，然后选择导出
3. 选择全部菜谱开关，然后导出。这应会下载一个 zip 文件。

导入：
前往 导入 > 来自应用 > tandoor，选择要从中导入的 zip 文件。

## 使用 pgbackup 容器进行备份
您可以添加 [pgbackup](https://hub.docker.com/r/prodrigestivill/postgres-backup-local) 来管理 postgres 数据库的定时与自动备份。
按您的环境修改以下内容，并将其加入 `docker-compose.yml`

``` yaml
  pgbackup:
    container_name: pgbackup
    env_file:
      - ./.env
    environment:
      BACKUP_KEEP_DAYS: "8"
      BACKUP_KEEP_MONTHS: "6"
      BACKUP_KEEP_WEEKS: "4"
      POSTGRES_EXTRA_OPTS: -Z6 --schema=public --blobs
      SCHEDULE: '@daily'
    # Note: the tag must match the version of postgres you are using
    image: prodrigestivill/postgres-backup-local:15
    restart: unless-stopped
    volumes:
      - backups/postgres:/backups
```
您可以通过运行 `docker exec -it pgbackup ./backup.sh` 手动启动一次备份。
