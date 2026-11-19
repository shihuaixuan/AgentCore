# 会话列表与按轮选择专家

侧边栏统一展示最近会话，保留置顶、分页和会话操作。会话页头展示会话标题。每轮回复展示该轮答复者的名称和头像；没有作者快照的旧消息使用会话原来的专家，普通会话使用 Otto。

新任务不选专家也能直接发送。个人工作区使用托管模型的首页会话，可以通过输入框「＋ → 专家」选择下一轮的答复者，也可以切回普通任务。切换保留原会话、聊天记录和文字草稿。对于不支持原地切换的会话，输入框会提示切换不可用；更改答复者的入口不会引导用户新建会话。已经添加的工作区附件或连接引用需要先移除，然后按新专家的权限重新附加。

发送时保存当前选择。`POST /api/chat/sessions/{session_id}/stream` 接收可选的 `recipient`：`{ "type": "otto" }` 或 `{ "type": "expert", "expert_id": "…" }`；省略时沿用会话原有身份。不同专家在同一会话中共享可见文字；外部连接授权、沙箱、私有文件和记忆按执行身份解析。已有审批不会交给其他专家；需要审批或续跑的操作可在该专家自己的任务中进行。构建器、外部渠道、自动化和其他专用会话沿用原有执行路径。

| 路径                                                                                 | 职责                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `frontend/src/components/layout/AppSidebar/components/RecentChats/`                  | 平铺最近会话和置顶会话。                                   |
| `frontend/src/app/(platform)/copilot/components/ChatInput/`、`useThreadRecipient.ts` | 在输入框选择下一轮答复者，按会话记住选择。                 |
| `frontend/src/app/(platform)/copilot/components/ChatMessagesContainer/`              | 展示会话标题和回复作者，兼容旧消息。                       |
| `backend/backend/api/features/chat/routes.py`、`backend/backend/copilot/executor/`   | 校验、排队并按所选身份执行一轮，保留会话原有资源作用域。   |
| `backend/backend/copilot/model.py`、`response_model.py`                              | 在现有消息元数据和事件流中记录实际答复者，无需数据库迁移。 |
