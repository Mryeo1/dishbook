Telegram 机器人旨在简化与 Tandoor 的某些交互。
它目前非常基础，但将来可能会扩展。

!!! warning "实验性"
    该功能被视为实验性功能。你可以使用它，它应该不会破坏任何东西，但将来你可能
    需要更新你的配置。
    其设置流程也绝对算不上用户友好，如果该功能受到欢迎或被扩展，这一情况很可能会改善。

!!! info "公网 IP/域名"
    要使用 Telegram 机器人，你需要一个可从外部访问的安装实例，否则 Telegram 无法发送消息。
    这一问题可以通过轮询 API 来规避，但目前尚未实现。

## 购物机器人
购物机器人会把你发送给它的任何消息添加到最新的未完成购物清单中。

要获得一个购物机器人，请按以下步骤操作

1. 使用 [BotFather](https://t.me/botfather) 创建一个新的 Telegram 机器人
   - 如果你想多人使用该机器人，请将其添加到群组并授予其管理员权限
2. 打开管理页面（点击你的用户名，然后点击 admin），选择 `Telegram Bots`
3. 创建一个新机器人
   - token：第一步获取的令牌
   - space：你的空间（通常为 Default）
   - user：该机器人面向的用户（决定所使用的购物清单）
   - chat id：如果你知道消息将从哪里发送，请输入 chat ID，否则会将其设为机器人收到消息的第一个聊天
4. 通过 `recipes.mydomin.tld/telegram/setup/<botid>` 访问你的安装实例，其中 botid 为你刚创建的机器人 ID
   你应该会看到以下消息：
    ```
    {
        "hook_url": "https://recipes.mydomin.tld/telegram/hook/c0c08de9-5e1e-4480-8312-3e256af61340/",
        "create_response": {
            "ok": true,
            "result": true,
            "description": "Webhook was set"
        },
        "info_response": {
            "ok": true,
            "result": {
                "url": "recipes.mydomin.tld/telegram/hook/<webhook_token>",
                "has_custom_certificate": false,
                "pending_update_count": 0,
                "max_connections": 40,
                "ip_address": "46.4.105.116"
            }
        }
    }
    ```

现在你应该能够向该机器人发送消息，并让这些条目出现在你最新的购物清单中。

### 重置
要重置机器人，请打开 `recipes.mydomin.tld/telegram/remove/<botid>`
