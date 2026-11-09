!!! info "社区贡献"
    本指南由社区贡献，既不受官方支持，也不保证更新或测试。

!!! danger "Tandoor 2 兼容性"
    本指南尚未针对 Tandoor 2 进行验证/测试，Tandoor 2 现在在默认 Docker 容器内集成了 nginx 服务，并将其服务暴露在 80 端口而非 8080 端口。

以下是适用于基于 pacman 的发行版（如 ArchLinux）的说明。该软件包可从 [AUR](https://aur.archlinux.org/packages/tandoor-recipes-git) 或 [GitHub](https://github.com/jdecourval/tandoor-recipes-pkgbuild) 获取。

## 功能
- systemd 集成。
- 提供 Nginx 配置。
- 使用 socket 激活。
- 使用非 root 用户。
- 自动应用迁移。

## 安装
1. 克隆软件包，使用 makepkg 构建并安装：
```shell
git clone https://aur.archlinux.org/tandoor-recipes-git.git
cd tandoor-recipes-git
makepkg -si
```
或使用你喜欢的 AUR 助手。

2. 设置 PostgreSQL 数据库和用户，方法见：manual.md

3. 在 `/etc/tandoor/tandoor.conf` 中配置服务。

4. 重新安装软件包，或按照[官方说明](manual.md)让 Tandoor 创建其数据库表。

5. 可选地配置反向代理。已提供 Nginx 的配置，但你也可以使用 Traefik、Apache 等。
编辑 `/etc/nginx/sites-available/tandoor.conf`。你可能需要改用另一个 `server_name`，或配置 TLS。然后：
```shell
cd /etc/nginx/sites-enabled
ln -s ../sites-available/tandoor.conf
systemctl restart nginx
```

6. 启用服务
```shell
systemctl enable --now tandoor
```

## 升级
```shell
cd tandoor-recipes-git
git pull
makepkg -sif
```
或使用你喜欢的 AUR 助手。
你无需执行其他操作。该软件包会自动应用迁移。如果 PostgreSQL 已更新到新的主版本，你可能需要[运行 pg_upgrade](https://wiki.archlinux.org/title/PostgreSQL#pg_upgrade)。

## 帮助
该软件包为非官方包。问题应提交至 https://github.com/jdecourval/tandoor-recipes-pkgbuild 或 https://aur.archlinux.org/packages/tandoor-recipes-git。
