# 远程 MCP：从连接器定义到专家调用

状态：设计提案，不是当前版本的功能清单。适用于云端、多租户的远程 MCP。目标是让新增一个使用已有认证方式的服务只需发布定义；市场、聊天「＋」、专家集成、工作流和实际工具调用不再各自选择账号或拼接凭据。

## 先分清三件事

- **传输**决定怎样交换 MCP 消息，如 Streamable HTTP、旧版 HTTP+SSE。两者不是认证方式，也不是同一个传输适配器。
- **取得凭据**只有三条首版路径：`none` 不收凭据；`user_input` 收取用户已有的凭据；`oauth2` 由平台代用户完成服务商授权。一个服务可以声明其中多条。
- **使用凭据**由所选方式的投递规则决定，例如指定请求头、`Authorization: Bearer`、HTTP Basic、指定查询参数。Bearer 描述如何发送，不能说明令牌是用户填写的还是 OAuth 换来的。

| 用户选的方式 | 创建连接时 | 每次调用时 |
| --- | --- | --- |
| 免认证 | 验证明确声明为公开的端点；保存连接，不创建虚假凭据 | 只访问这个端点，不发认证头、Key 或其他连接的凭据 |
| 填凭据 | 按声明渲染字段；也可以粘贴敏感链接，拆出真实端点和 Key；验证后分开保存 | 后端取出这一条连接的凭据，按声明注入指定头或参数 |
| OAuth | 使用同一套开始、回调、换令牌流程；客户端注册可采用预注册或受支持的动态注册 | 使用该连接的 access token；按服务约定刷新，不要求每次打开浏览器 |

CLI 自登录是不同的执行环境，不是第四个输入框。首版不执行第三方包里的 `auth`、`preAuth` 或 shell 命令，也不把这类连接器显示为可用的匿名 MCP。未来接 CLI 需要单独做每个用户的运行环境、凭据文件隔离、状态查询和注销。

## 两个业务对象，一项使用权

| 对象 | 关键字段和职责 |
| --- | --- |
| `ConnectorDefinition`（连接器定义） | 稳定 `connector_id`、定义版本、名称、传输、`methods[]`。每种方式分别声明输入字段、端点约束、凭据投递规则；OAuth 额外声明发行方/发现规则、客户端注册方式和 scopes。公开定义不含 client secret 或任何用户的 Key。 |
| `UserConnection`（用户连接） | 稳定 `connection_id`、平台组织和归属主体、`connector_id`、定义版本、选定的 `method_id`、实际端点、可空 `credential_ref`、服务商账号/租户（能验证时）、实际获准 scopes（未知不冒充已授予）、状态和连接版本。一个人可给同一服务建两个账号连接。轮换同一账号的 Key 不必改变连接 ID。 |
| 使用权与选择 | `ExpertConnectionGrant` 表示哪个专家可使用哪个 **connection_id**；会话或工作流记录本次明确选用哪一个。密钥仍在凭据库，不随授权复制给专家。授予专家使用权不是再次向服务商登录；撤销某专家的授权也不应删除其他使用者的连接。 |

因此“只有两类业务数据”不等于数据库只能有两张表。现有 `IntegrationCredential.encryptedPayload` 可继续保管秘密，OAuth 临时状态也有自己的生命周期。**不把连接 ID 等同于凭据 ID**：免认证连接没有凭据，密钥可轮换，而一个连接应始终可被选择、停用或撤销。

## 定义示例：同一服务的两种入口

以下是目标配置格式的示意，不是当前导入器可直接使用的 JSON。`idSegment` 是平台提供的单一路径段校验；`extract` 和 `apply` 是有穷的声明规则，不是允许执行的脚本。

```json
{
  "connector_id": "mcp_dingtalk_mail",
  "version": 1,
  "transport": "streamable-http",
  "methods": [
    {
      "id": "sign_in",
      "kind": "oauth2",
      "endpoint": {"origin": "https://mcp-gw.dingtalk.com", "path": "/oauth/server/mail"},
      "oauth": {"discovery": "mcp", "issuers": ["https://mcp-gw2.dingtalk.com"], "registration": "dynamic", "scopes": ["user"]},
      "apply": [{"from": "oauth.access_token", "to": "header", "name": "Authorization", "encoding": "bearer"}]
    },
    {
      "id": "key_link",
      "kind": "user_input",
      "fields": [{"id": "link", "type": "secret_url", "required": true}],
      "endpoint": {"origin": "https://mcp-gw.dingtalk.com", "path": "/server/{instance}", "params": {"instance": "idSegment"}},
      "extract": {"from": "link", "query": {"key": "secret.api_key"}},
      "apply": [{"from": "secret.api_key", "to": "query", "name": "key"}]
    }
  ]
}
```

其他服务不需要复制钉钉的代码。公开服务声明 `kind=none` 和空 `apply`；邓白氏声明一个 secret 字段并投递到 `Authorization`（Bearer）；腾讯地图则把 secret 投递到 `key` 参数，保留定义中非敏感的固定参数 `format=0`。腾讯地图参考配置的传输是 **SSE**：若首版只实现 Streamable HTTP，可以复用它的凭据设计，但不能把这个端点标为已支持。要原样上架，先验证旧版 SSE 的发现和实际调用。

## 从市场到工具调用

1. **发布定义。** 校验版本、受支持传输、唯一 method ID、字段与投递规则一致、允许的 HTTPS origin/端口/路径。不支持的模式拒绝发布或明确不可用，不把缺失字段解释为免认证。目录只展示该服务声明且本平台可执行的方式：一种直接进表单，多种才显示选择器。
2. **创建或复用连接。** 市场、「＋」和专家页调用同一个连接服务。若已有兼容连接，先给出账号选择；否则以 `connector_id + method_id` 开始。`none` 直接验证；`user_input` 走敏感输入通道；`oauth2` 返回授权跳转和一次性状态。OAuth 回调绑定发起人、组织、方法、发行方、回调地址和 PKCE。不能注册客户端时区分“平台需要预注册”和“用户拒绝”，不自动降级为匿名或手填 Key。
3. **验证和保存。** 在后端按选中传输初始化并 `tools/list`，不发邮件或执行其他业务写入。能列工具不等于对每个工具都有权限；有效空列表也不是凭据失效。验证通过后建立连接和加密凭据引用，对 UI 只返回连接 ID、可读账号标识和状态。失败的草稿不可用，重复回调或重试不能产生第二条意外连接。
4. **选给专家。** 在专家视图中明确选择连接 ID 后，写入使用权并保存选用关系。若个人连接创建成功、专家授权失败，显示“连接已保存，尚未授予本专家”，允许只重试授权。不能默认为所有专家开放。
5. **发现和执行共用一次解析规则。** `resolveConnection(actor, organization, expert, connector_id, selected_connection_id)` 校验归属、授权、服务 ID、启停状态、定义版本。列表、聊天卡片、聊天工具、工作流和审批恢复都用它，不能有一条路径按域名另找连接。无显式选择时只在该主体和该服务的合格集合中解析；有多个候选就让用户选，绝不取“最新一个”。
6. **只在后端发请求时注入。** 模型只拿工具名称、参数定义和不含秘密的连接引用。服务端在真实端点校验后解密，按规则投递；凭据不进入模型、卡片、日志、追踪、重试报错或审批准入信息。审批绑定实际连接 ID、目的端点、工具及相关版本，恢复时复核绑定和专家授权。即便获得连接，发送邮件等操作仍受工具级权限与审批约束。

### 三个共用接口的职责（目标契约）

| 操作 | 输入与可信来源 | 返回与副作用 |
| --- | --- | --- |
| `startConnection` / `completeConnection` | 前端提交定义 ID、方法 ID 和该方法的表单值；用户和组织取自已认证会话。OAuth 回调以一次性状态关联同一个建连请求。 | 返回 `needs_input`、`redirect_required`、`failed`，或验证过的 `ready + connection_id`。创建个人连接不自动给所有专家授权。 |
| `selectConnectionForExpert` | 用户在专家界面明确选中的 `expert_id + connection_id`。后端验证用户能管理该专家、连接归属和服务一致。 | 写入或复用同一条授权并确认所选账号；重复点击不会重复创建连接。撤销使用权针对这个关系，而不是销毁用户凭据。 |
| `resolveConnection` → `listTools` / `callTool` | 从已认证会话、专家或工作流绑定取得 `connection_id`；即使外部请求携带 ID，也重新校验权限。禁止模型自带真实 URL、头或 Key 来替换所选连接。 | 解析器返回内部调用上下文，或一个可供 UI 处理的原因（`needs_connection`、`needs_grant`、`needs_selection`、`reauth_required`、`unavailable`）。只有校验通过的上下文能交给传输层；工具列表和执行不能各自换账号。 |

例如，用户在市场用 API Key 建立邮箱连接 `C1`，在聊天「＋」将 `C1` 选给专家 `E1`。`E1` 的工具发现和后续调用都解析 `C1`；另一个专家 `E2` 只能请求使用 `C1`，不能因为二者同属一个组织就读取邮箱。轮换 `C1` 的 Key 不应让 `E1` 再向钉钉登录；如果实际换成了另一个账号，则创建或显式选择新连接，不静默继承原账号的授权。

这条链路的判断不是“用户本次有没有填写内容”，而是：

| 解析结果 | 用户看见什么 | 后端做什么 |
| --- | --- | --- |
| 已选、已获授权、可用 | 直接使用 | 用这条连接的真实端点和已保存方式调用，不再弹认证卡 |
| 账号已有，专家未获授权 | 使用已有连接 | 经用户确认授予指定连接；不换令牌、不要求重填 Key |
| 同服务有多个合格账号，没有明确选择 | 选择账号 | 不代选，不调用远端 |
| 首次使用 | 公开方式显示“测试并连接”；私有方式显示该服务支持的授权选择 | 空凭据不能让私有方法变为匿名；其他服务的甚至同域名的 Key 都不能借用 |
| 凭据失效、权限不足、服务故障 | 分别提示重新连接、缺少权限、稍后重试 | OAuth 可安全刷新时优先刷新；确认失效才要求重连。403/限流/网络超时不能一律删除凭据。结果未知的写操作不自动重放 |

## 在现有代码中落地

| 改造顺序 | 复用点与交付物 |
| --- | --- |
| 1. 定义与校验 | 在 `backend/integrations/mcp_catalog.py` 的目录模型上增加版本化 `methods`、端点和投递定义。将现有 `auth_methods` 映射成兼容视图。无新能力的服务不必改 UI 或新增 API。客户端拿表单描述，服务端持有投递与来源校验策略。 |
| 2. 连接与归属 | 扩展 `CustomMCPConnection` 或迁入等价的统一连接记录，使预设和自定义都在同一 API 返回连接 ID。复用 `IntegrationCredential` 加密存储和已有 OAuth 回调/刷新代码。为 MCP 增加按连接授权的关联，不能用没有组织维度的 URL 反查替代授权。保留非 MCP 的现有 `ExpertCredential` 语义。 |
| 3. 共用运行时和界面 | 将手填字段提取、头/参数注入从厂商判断移到受控解释器。把 `run_mcp_tool`、MCP block、工具发现、连接卡、审批恢复切到同一个解析器；市场和专家页仅传选中的连接 ID。显示“已就绪”与实际工具调用必须用同一套判断。 |
| 4. 迁移与启用 | 先双读和影子比对，不发送双份远端请求。带明确目录绑定、归属和授权关系的旧记录才能迁移；只剩网关域名或含糊端点的记录由用户一次性指认，保留原授权，不跨账号继承。先迁移钉钉和一个非钉钉服务；读、写、撤权及回滚验收通过后再切其余目录。使用数据库目录的部署还需发布对应定义版本。 |

**不可省略的约束：** 不放开任意 URL 查询参数。只允许定义指定的 origin、路径、参数名和可写请求头；不允许任意模板代码、重复密钥参数或跳转到未授权目标。凭据必须在所有网络目的地检查之后注入，不能靠发送之后再给日志打码。将 `?key=…` 从链接拆出是已知格式的策略；若供应商用整条签名 URL，不能擅自改顺序、拆签名或把它当普通地址存储。未知格式明确不支持。钉钉的 `/server/<id>` 本身不能证明它是邮箱还是日历：首次绑定须基于用户所选的预设；只有服务端明确提供服务身份时才能进一步核对。

## 可执行的验收口径

使用本地假 MCP 和假 OAuth 授权服务器，覆盖**市场建连 → 专家选用 → 同一会话列工具 → 调用一个无副作用工具 → 撤权再调**；断言真实发出的请求、数据库归属、卡片状态，而不只是接口 `200`。最低合格线：

| 用例 | 必须观察到的结果 |
| --- | --- |
| 公开端点 | 无登录页、无凭据记录、无认证头；初始化和工具调用成功。没有主动选择公开方式时，不对私有调用做匿名降级。 |
| 自定义 Header 与查询参数两个非同构服务 | 同一表单处理器和运行时；前者仅发配置的头，后者仅发一次正确编码的参数，保留允许的固定参数；两者均不请求 OAuth。添加第二个服务只改定义和测试夹具。 |
| 钉钉同一网关下的邮箱和日历 | 专家选邮箱的 API Key 连接，调用仅到它的专属端点，不请求目录 OAuth URL；日历或另一账号的凭据不能串用。单测之外须经过真实 UI/后端契约。 |
| OAuth（动态注册与预注册各一个夹具） | 相同回调与刷新逻辑。第一次授权并调用成功；并发到期只刷新一次，刷新后保持连接 ID；失效且不可刷新才提示重连。 |
| 权限与恢复 | 账号有连接但专家无权时只显示授予已有连接；撤权/跨租户/审批期间换账号后拒绝执行。多账号不代选；超时不清凭据、不重复执行写操作。 |
| 脱敏与传输 | 注入可识别的假密钥，检查模型上下文、持久化公共字段、响应、追踪和日志均不含它。分别验证每种宣称支持的传输；没有 CLI 沙箱或旧版 SSE 适配器时，不把依赖它们的配置算作可用。 |

## 对照依据

- [WorkBuddy 官方连接器开发文档](https://open.workbuddy.cn/docs/connector)：公开、`token` 表单、`server-side` 托管授权和 CLI 生命周期的参考。不照搬其本机凭据存储到多用户云端。
- [腾讯地图](https://github.com/infometa/workbuddyskills/blob/main/connectors/tencent-map/mcp.json) 的配置是 SSE、查询参数 `key` 和固定 `format=0`；[邓白氏](https://github.com/infometa/workbuddyskills/blob/main/connectors/dnb-global-data/mcp.json) 是 `Authorization: Bearer`。[EdgeOne](https://github.com/infometa/workbuddyskills/blob/main/connectors/edgeone-pages/mcp.json) 的 MCP 配置含 `preAuth: cli`；[腾讯会议](https://github.com/infometa/workbuddyskills/blob/main/connectors/tmeet/cli.json) 含 `auth/status/unAuth`。这些是配置证据，不是账号级联调结果。
- [市场配置包](https://acc-1258344699.cos.ap-guangzhou.myqcloud.com/connectors-config-v2/connectors-config.zip) 的 2026-11-11 快照，SHA-256 `f0444ceb38882e54de72cf29e68370609baf158fc5e438f27a54adf6684db3b5`。按 `.codebuddy-connector/connectors.json` 计数有 632 个唯一 ID，134 条声明 `auth_mode=token`；包中有 134 份 `token-schema.json`。不把文档的三种抽象当成包中所有原始标签，也不据此声称平台兼容 632 项。
