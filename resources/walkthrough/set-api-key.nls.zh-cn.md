# 设置 OpenRouter API Key

1. 在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 Key。
2. 从命令面板运行 **OpenRouter: 设置 API Key**。

Key 保存在 VS Code SecretStorage（系统密钥链），不会写入 `settings.json`。

| 命令 | 作用 |
| ---- | ---- |
| **OpenRouter: 设置 API Key** | 设置或更新 Key |
| **OpenRouter: 清除 API Key** | 删除 Key |
| **OpenRouter: 打开 API Key 页面** | 打开 openrouter.ai/keys |
| **OpenRouter: 查询用量** | 打开 openrouter.ai/activity |

设置后若模型未出现，运行 **OpenRouter: 刷新模型列表**。
