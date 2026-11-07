翻译在 [translate.tandoor.dev](https://translate.tandoor.dev/) 上进行管理，这是 [Weblate](https://weblate.org/de/) 的自托管实例。

你只需注册一个账户，然后按以下步骤添加翻译：

1. 注册后，系统会要求你选择语言。这是可选的，但可以让 Weblate 只向你显示相关的翻译。
2. 在导航栏中点击 `Projects`，然后点击 `Browse all projects`。
3. 选择 Tandoor，然后在右上角选择 `Watch project Tandoor`（点击 `Not watching`）。
4. 返回仪表盘。现在它会向你显示与你的语言相关的翻译。点击铅笔图标即可开始。

<!-- prettier-ignore -->
!!! info "创建新语言"
    要创建新语言，你必须先选择 Tandoor（项目），然后选择一个组件。
    在这里你可以选择添加该语言。之后你也可以直接将其添加到其他组件中。
    一旦某个新语言（部分）完成，请在 GitHub 上告诉我，这样我就能将它添加到 Tandoor 自身的语言切换器中。

Weblate 本身也提供了[大量文档](https://docs.weblate.org/en/latest/user/translating.html)。

![2021-04-11_16-03](https://user-images.githubusercontent.com/6819595/114307359-926e0380-9adf-11eb-9a2b-febba56e4d8c.gif)

也可以通过使用 `manage.py makemessages -l <language_code> -i venv` 创建新语言
来直接提供翻译。完成后，只需用更改过的文件发起一个 PR。这有时会导致
与 Weblate 合并时出现问题，所以我更倾向于使用 Weblate。
