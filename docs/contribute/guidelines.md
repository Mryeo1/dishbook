如果你想贡献缺陷修复或小幅调整，那么你的 PR 永远受欢迎！

<!-- prettier-ignore-start -->
!!! danger "先讨论！"
    如果你想贡献会给项目带来更多复杂度的大型功能，请
    确保**先提交一份技术描述**，概述你想做什么以及如何做。
    这样可以让我和社区给出反馈，并管理整个
    应用的复杂度。如果你没有这样做，那么在我拒绝你的 PR 时请不要生气。
<!-- prettier-ignore-end -->

## 许可证

为 Tandoor 做贡献需要签署贡献者许可协议。你可以在[此处](https://cla-assistant.io/TandoorRecipes/recipes)查看该 CLA。

## 代码检查与格式化

Tandoor 使用若干库来保持风格和格式化的一致性。
要为项目做贡献，你必须按照项目定义的配置使用以下软件包：

- flake8
- yapf
- isort
- prettier

<!-- prettier-ignore -->
!!! tip "手动格式化"
    手动运行格式化是可行的，但建议将 IDE 设置为保存时格式化。
    ``` bash
    flake8 file.py --ignore=E501 | isort -q file.py | yapf -i file.py
    prettier --write file.vue
    ```

## 测试

Django 使用 pytest-django 实现完整的测试套件。如果你做了任何功能性更改，请实现相应的
测试。

Tandoor 也在积极征集愿意搭建 vue3 测试的贡献者。如果你在这方面有知识，将不胜感激。

## API 客户端

<!-- prettier-ignore -->
!!! note "需要 JAVA"
    OpenAPI Generator 是一个 Java 项目。要使其正常工作，你的 PATH 中必须有可执行的 java 二进制文件。

Tandoor 使用 [django-rest-framework](https://www.django-rest-framework.org/) 实现 API。做出会影响 API 的贡献需要理解
ViewSet 和序列化器。

API 客户端是由 Django REST framework 提供的 OpenAPI 接口自动生成的。
为此使用了 [openapi-generator](https://github.com/OpenAPITools/openapi-generator)。

使用你偏好的安装方式进行安装。（例如，使用 `npm install @openapitools/openapi-generator-cli -g`。）

### Vue

使用主目录中的 `generate_api_client.py` 脚本生成架构。

## 安装与配置

[VSCode](/contribute/vscode) 的说明
[PyCharm](/contribute/pycharm) 的说明
