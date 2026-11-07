# 如何把 sqlite3 数据库迁移到 postgresql
这份迁移指南是在使用 unraid 模板（docker）的 TandoorRecipes 1.3.0 版本时写下的。
部分命令是 unraid 专用的，但整体上适用于任何部署方式。

1. 先备份你的 `/mnt/user/appdata/recipes` 目录。

2. 不要改动任何设置，通过 Web 界面进入 TandoorRecipes 容器的命令行，或执行 `docker exec -it TandoorRecipes /bin/sh`
```cmd
cd /opt/recipes
./venv/bin/python manage.py export -a > /data/dump.json
```

3. 创建一个 Postgresql 数据库（为菜谱新建独立的用户与数据库）

我用的是 `postgresql14` 模板。

```cmd
psql -U postgres
postgres=# create database tandoor;
postgres=# create user tandoor with encrypted password 'yoursupersecretpassworddontusethisone';
postgres=# grant all privileges on database tandoor to tandoor;
```

4. 现在修改 TandoorRecipes 模板里的几个环境变量：
```env
DB_ENGINE=django.db.backends.postgresql  # Database Engine, previous value: `django.db.backends.sqlite3`
POSTGRES_HOST=<Your unraid host ip>  # PostgreSQL Host
POSTGRES_PORT=5432  # PostgreSQL Host
POSTGRES_USER=tandoor  # PostgreSQL User
POSTGRES_PASSWORD=yoursupersecretpassworddyoudidntcopy  # PostgreSQL Password
POSTGRES_DB=tandoor  # Database, previous value: `/data/recipes.db`
```

5. 保存，然后启动一次容器。

它会在 postgresql 数据库上执行全部数据库迁移。

6. 通过 Web 界面进入容器的命令行，或执行 `docker exec -it TandoorRecipes /bin/sh`
```cmd
cd /opt/recipes
./venv/bin/python manage.py import /data/dump.json
```

7. 享受新的模糊搜索和**略微**提升的性能吧！
