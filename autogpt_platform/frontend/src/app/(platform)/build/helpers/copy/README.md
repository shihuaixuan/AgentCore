# 构建页中文词库

- `blocks.zh-CN.json` 按后端模块 UUID 保存中文名称和说明。`type` 和 `source` 必须与后端类名和说明一致；不同名称的自定义工作流及更新后尚未翻译的说明不会被旧译文覆盖。
- `schema.zh-CN.json` 保存内置模块的字段标题、说明和输入提示。只在展示时查表；不要在此收录用户输入、示例文件内容或第三方 MCP 工具的动态定义。字段键、枚举值、连线和执行数据均应使用原值。

更新后端模块后，可在 `autogpt_platform/backend` 目录使用已有的 Python 环境检查：

```sh
poetry run python ../frontend/scripts/localization/check-builder-catalog.py
```

该命令只读取当前配置下的模块注册表和词库，不启动服务。可用模块数随启用的集成而变化。
