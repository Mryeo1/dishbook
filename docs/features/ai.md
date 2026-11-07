Tandoor 拥有若干基于 AI 的功能。为实现最大灵活性，你可以配置不同的 AI 提供商，并根据要执行的任务进行选择。
为防止意外的成本升级，Tandoor 拥有一套健壮的系统来跟踪和限制 AI 成本。

## AI 的使用场景
AI 目前用于少数几项聚焦的任务：

- 从图片、PDF 或原始文本导入菜谱。
- 整理菜谱步骤并将食材分配到步骤中。
- 提取食物和菜谱属性（营养信息及其他元数据）。

所有 AI 调用均通过 LiteLLM 路由，因此在正确配置后，可使用 LiteLLM 支持的任何提供商（或 OpenAI 兼容端点）。

## 默认配置
默认情况下，每个空间都启用了 AI 功能。每个空间的每月支出上限约为 1 USD。
可通过 [配置变量](https://docs.tandoor.dev/system/configuration/#ai-integration) 修改此项

你可以随时使用 django 管理后台更改这些设置。如果你不在意 AI 成本，可以填入非常高的上限，或为你的提供商禁用成本跟踪。
该上限在每个月的第一天重置。 

## 配置 AI 提供商
当某个空间启用 AI 支持后，该空间中的每位用户都可以配置 AI 提供商。 
编辑器中展示的模型都经过测试并可与 Tandoor 配合使用。大多数能够解析图片/文件并返回文本的其他模型也应可用。 

超级用户还可以配置所有空间均可使用的全局 AI 提供商。

### 自托管设置
要在自托管实例上使用 AI，你需要：

1. 在你的空间中启用 AI（或通过环境变量设置默认值）
2. 至少创建一个 AI 提供商
3. 使用 AI 功能时选择该提供商 

如果你希望某个提供商在所有空间中可用，请以超级用户身份创建全局 AI 提供商。否则创建特定于空间的提供商。

### 提供商字段
创建 AI 提供商时，以下字段很重要：

- **名称**：界面中显示的友好标签。
- **模型名称**：提供商模型标识符（示例：`gpt-4o-mini`）。
- **API 密钥**：模型所必需。对于不需要密钥的本地提供商，可填入任意非空值。
- **URL**：OpenAI 兼容端点的可选基础 URL（例如自托管网关）。
- **记录额度成本**：启用成本跟踪。若禁用，则不会对该提供商强制执行每月额度限制。

### 提供商示例
常用提供商的示例。有关模型命名、认证和基础 URL 的详细信息，请参阅 LiteLLM 提供商文档：
`https://docs.litellm.ai/docs/providers`

#### OpenAI (gpt5.2-mini)

```text
Name: OpenAI gpt5.2-mini
Model name: gpt5.2-mini
API key: <your OpenAI API key>
URL: 
Log credit cost: enabled
```

#### OpenRouter (Gemini)
OpenRouter 为许多模型提供 OpenAI 兼容端点。模型名称必须以 `openrouter/` 为前缀。
选择一个支持 JSON 模式且（如有需要）支持视觉输入的 Gemini 模型。LiteLLM 可在没有基础 URL 的情况下路由 OpenRouter，显式设置也可以。

```text
Name: OpenRouter Gemini
Model name: openrouter/google/gemini-2.5-flash-lite
API key: <your OpenRouter API key>
URL: https://openrouter.ai/api/v1
Log credit cost: enabled
```

#### Google AI Studio (Gemini)

```text
Name: Gemini 2.5 Flash
Model name: gemini/gemini-2.5-flash
API key: <your Google AI Studio API key>
URL: (leave empty)
Log credit cost: enabled
```

### 对模型的要求
Tandoor 期望每次 AI 调用都返回结构化 JSON 响应，因此你的模型必须支持 JSON 模式或能稳定返回 JSON。
对于图片/PDF 导入，提供商必须支持视觉输入。

<!-- prettier-ignore -->
!!! warning
     AI 导入会在请求中以 base64 形式发送整个文件。大文件可能超出提供商限制或反向代理限制。
     请考虑缩小图片尺寸，或对大文档使用文本导入路径。

## 故障排查

- **需要 JSON 模式**：如果模型忽略 `response_format`，Tandoor 将无法解析响应，请求会报错。
- **视觉支持很重要**：图片/PDF 导入使用 `image_url`。不支持视觉的模型会失败。PDF 处理取决于提供商；有些提供商只接受图片。
- **超时**：AI 调用是同步的。较慢的模型可能触发反向代理或应用服务器超时。如果你的提供商较慢，请提高超时时间。
- **速率限制**：`AI_RATELIMIT` 会限制 AI 端点（默认 `60/hour`）。批量使用时，请提高此限制。
- **成本跟踪依赖 LiteLLM**：如果提供商不返回用量或成本数据，日志和额度限制可能无法反映真实用量。
- **OpenRouter 模型名称**：使用 `openrouter/` 前缀，并选择支持结构化输出的模型（OpenRouter 模型列表：`https://openrouter.ai/api/v1/models?supported_parameters=structured_outputs`）。

## AI 日志
AI 日志允许你跟踪 AI 调用的使用情况。在这里你还可以查看用量。
