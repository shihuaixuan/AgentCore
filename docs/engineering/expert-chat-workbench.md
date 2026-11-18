# 统一聊天入口与专家选择

新任务从首页输入框开始。默认是普通任务，可以直接发送，输入框不显示专家标签。点击「＋ → 专家」可按名称或职责搜索；选中后才会显示专家头像和名称。发送前可点标签更换专家，或点「取消选择专家」回到普通任务。文本草稿和本地附件会保留；如果草稿包含工作区附件或连接引用，需要先移除这些引用才能更改专家选择。

已有对话保留原身份。在普通对话里选择专家，或在专家对话里更换专家或点「新建普通任务」，都需要确认另开对话。旧消息和附件不导入新会话，未提交的原会话文本草稿仍可在原对话中继续编辑。侧边栏保留历史分组、置顶、会话操作与新成员入职引导，取消历史分组里的新建入口。

| 路径                                                                                 | 职责                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `autogpt_platform/frontend/src/app/(platform)/copilot/components/ChatInput/`         | 「＋ → 专家」入口、专家标签、搜索、清除选择、另开对话确认与附件限制。                                                          |
| `autogpt_platform/frontend/src/app/(platform)/copilot/components/EmptySession/`      | 首页选择专家、更新首条消息的接收者；同一新任务草稿与接收者解耦。                                                               |
| `autogpt_platform/frontend/src/app/(platform)/copilot/components/ChatContainer/`     | 已有对话向输入框传递会话专家，并接入新任务导航。                                                                               |
| `autogpt_platform/frontend/src/components/layout/AppSidebar/components/RecentChats/` | 展示历史及入职引导；新任务统一从首页输入框发起。                                                                               |
| `autogpt_platform/frontend/src/app/(platform)/copilot/useChatSession.ts`             | 复用原有接口，仅为专家任务提交 `expert_id`。新任务 URL 的 `new=1` 避免自动进入目标专家的最近会话。                             |
| `autogpt_platform/backend/backend/copilot/`                                          | Copilot 执行两类任务。普通任务使用平台默认助手身份 Otto；专家任务按 `expert_id` 加载专家身份和相关配置。无需后端或数据库迁移。 |
