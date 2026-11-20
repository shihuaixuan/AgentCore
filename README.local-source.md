# AutoGPT 本机源码运行

## 运行方式

- 源码仓库：`https://github.com/significant-gravitas/autogpt.git`。
- 当前源码提交：`ac4e88888d3838fd5790dff2a85845a654d05024`。
- 源码位置：`E:\work\AutoGPT`，WSL 内为 `/mnt/e/work/AutoGPT`。
- 前后端都从此源码运行，不使用 AutoGPT 项目镜像：后端为 `poetry run app`，前端为本地源码构建后的 `node .next/standalone/server.js`。
- Docker 仅运行 PostgreSQL/pgvector、三节点 Redis、RabbitMQ、FalkorDB 和 ClamAV。

当前版本后端使用 `os.O_DIRECTORY`、`os.O_NOFOLLOW` 及 `dir_fd` 等 POSIX 文件安全功能，不能直接在 Windows Python 下运行。因此使用独立的 Ubuntu 24.04 WSL 发行版 `AutoGPT-Ubuntu`，没有改动这些安全实现。

## 存储位置

- WSL 虚拟磁盘：`E:\work\AutoGPT\.local-runtime\wsl\AutoGPT-Ubuntu\ext4.vhdx`。
- Python 3.12、Node.js 24、Poetry、依赖、缓存和额外 6 GiB swap 均在此 E 盘虚拟磁盘中，主要目录为 `/opt/autogpt`。
- 前端 `node_modules` 和 `.next` 使用 E 盘 WSL 文件系统，通过 bind mount 挂入原始源码目录。源码仍在原始 Git checkout 中。
- PostgreSQL 数据：`E:\work\AutoGPT\autogpt_platform\data\db\data`。
- 其余 Docker 数据沿用现有 Docker Desktop 的 `D:\DockerData\main` 存储位置，没有迁移或重装 Docker。
- Windows 系统已有的 WSL/Docker/系统分页文件位置不在此脚本的管理范围内，不保证系统运行时完全不写 C 盘。

## 启动、状态和停止

本地前端启用 `NEXT_PUBLIC_AUTH_USERNAME_SIGNUP=true`，并保持 `AUTH_REQUIRE_EMAIL_VERIFICATION=false`。新账号使用唯一用户名和密码注册，无需邮箱或逐人审批；已有邮箱账号仍按原方式登录。用户名不区分大小写，支持中文、字母、数字、下划线和连字符。用户名账号不能通过邮件找回密码。所有新账号（包括第一个）都是平台普通用户，仅能管理自己的个人组织。

兼容性：认证表仍使用 `email` 唯一列。用户名规范化后编码到保留域 `username.invalid`，这是不可投递的内部标识，不是联系邮箱。不需要迁移历史账号。注册总开关和显式配置的白名单仍由实例运营者控制。已有部署须在构建前设置上述前端变量，重新构建并重启服务。

在 PowerShell 中运行：

```powershell
cd E:\work\AutoGPT
powershell -ExecutionPolicy Bypass -File .\start-source.ps1
powershell -ExecutionPolicy Bypass -File .\start-source.ps1 -Action Status
powershell -ExecutionPolicy Bypass -File .\start-source.ps1 -Action Stop
```

启动脚本只启动明确列出的中间件，不运行 Compose 中的项目、迁移或前端容器；迁移已通过源码环境执行。启动后等待后端 `/health` 和前端 `/login` 返回 HTTP 200，超时会明确报错。停止操作仅终止 `AutoGPT-Ubuntu` 发行版及本项目中间件，不停止其他 WSL 发行版或已有 `agent-zero` 容器。

- 前端：`http://localhost:3000/login`。
- 后端健康检查：`http://localhost:8006/health`。
- API 文档：`http://localhost:8006/docs`。
- WebSocket：`ws://localhost:8001/ws`。
- 应用仅监听本机回环地址，不配置外网或局域网访问。

首次后端启动会导入大量组件，低内存机器可能需要几分钟。当前设置将工作流并发降至 2、聊天 worker 降至 1；16 GiB Windows 主机在同时运行其他应用时仍可能使用 swap，不能据此推断高并发能力。

## 日志与配置

- 日志：`.local-runtime\logs\backend.stdout.log`、`backend.stderr.log`、`frontend.stdout.log`、`frontend.stderr.log`。
- 中间件配置：`autogpt_platform\.env`。
- 后端配置：`autogpt_platform\backend\.env`。
- 前端配置：`autogpt_platform\frontend\.env`。
- WSL 环境与启动脚本：`.local-runtime\environment-wsl.sh`、`run-backend-wsl.sh`、`run-frontend-wsl.sh`。

这些 `.env` 中含本机生成的密码和签名密钥，不要提交或分享。`.local-runtime` 已在 Git 的本机排除规则中忽略。

## 初始化与验证范围

- 已应用 269 个数据库迁移，已导入官方目录的 407 个技能及 33 个专家模板。
- 技能目录源码在 `.local-runtime\skills-catalog`，提交为 `a5dc0724d9d3b51448d59eb89bf64568cb83178a`。GitHub REST API 限流时改用 Git 拉取，并通过 `poetry run publish-skills-catalog --path /mnt/e/work/AutoGPT/.local-runtime/skills-catalog --skip-missing-preloads` 导入。
- 按官方 fresh-install 选项跳过了 13 个没有对应商店条目的预装工作流；技能和专家本身已导入。没有加载上游带测试用户的 `load-store-agents` 样例数据。
- 已验证生产构建、登录页浏览器渲染、前后端健康检查、WebSocket 健康检查、认证 session/JWKS 接口和重复启动。没有创建用户账号，也没有冒用邮箱；注册、登录后的业务流程和真实模型调用未验证。

## 模型与邮件服务

尚未提供模型供应商 API key。平台页面和数据库就绪不等于模型调用已配置：聊天、嵌入和依赖第三方 API 的组件仍需对应凭据。后端支持在 `.env` 中配置 `OPEN_ROUTER_API_KEY`、`ANTHROPIC_API_KEY`，或按上游 `.env.default` 配置 `CHAT_USE_LOCAL` / `CHAT_BASE_URL` / `CHAT_API_KEY`；不同功能的凭据要求不同，不应把任一 key 当作所有功能的通用替代。配置后重启服务。未配置嵌入模型时，后台嵌入回填会报错；本机未配置 Postmark 时不会发送验证/找回密码邮件。

### 入门语音录音转写（后端）

`CHAT_USE_LOCAL=true` 不会把录音发给聊天服务。默认仅直连 OpenAI，依次读取 `OPENAI_INTERNAL_API_KEY`、`OPENAI_API_KEY`；两者都未设置时，语音转写不可用。

若决定将录音交给其他服务，在后端 `.env` 中显式设置 `BRAIN_DUMP_TRANSCRIPTION_BASE_URL`（API 根地址，例如 `http://127.0.0.1:8001/v1`）和 `BRAIN_DUMP_TRANSCRIPTION_MODEL`。该地址必须从后端可达，并支持 `POST /audio/transcriptions`；远程服务请使用 HTTPS。需要鉴权时另设 `BRAIN_DUMP_TRANSCRIPTION_API_KEY`，不会自动借用聊天或 OpenAI 密钥。本机聊天网关的 `qwen3-asr-flash` 已用合成语音验证；只有在同意把录音发给该网关时，才将其 API 根地址和凭据显式填入转写配置。

自定义端点默认模型为 `whisper-1`，默认没有备用模型；可用 `BRAIN_DUMP_TRANSCRIPTION_FALLBACK_MODEL` 指定同一端点支持的备用模型。失败不会改投其他端点。保存配置后重启后端。

本地模式无需配置私有云存储桶即可转写。此时服务端暂存在 Redis 的录音分片在转写结果保存后删除，失败时保留至缓存到期；浏览器保留的副本仍可用于重试。

## 修改源码后

后端修改后重启即可；前端使用生产构建，修改后需要重新构建。为避免构建和后端同时占满内存，先停止，再单独构建：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-source.ps1 -Action Stop
wsl -d AutoGPT-Ubuntu -u root -- bash /mnt/e/work/AutoGPT/.local-runtime/prepare-wsl.sh
wsl -d AutoGPT-Ubuntu -u autogpt -- bash /mnt/e/work/AutoGPT/.local-runtime/build-frontend-wsl.sh
powershell -ExecutionPolicy Bypass -File .\start-source.ps1
```

构建脚本限制 CPU 并发并关闭 source map；`NEXT_SKIP_BUILD_CHECKS=true` 跳过构建内的 lint/typecheck，并不表示这些检查通过，也不代替上游测试。如修改接口，需按前端上游说明重新生成 API 客户端。启动脚本及路径针对本机工作区，移动目录或删除 `.local-runtime` 后需要重新配置，不能只复制启动脚本到另一台机器使用。

## 本地技能目录与自动发布

本机正常启动沿用 PostgreSQL 中已有的技能和专家，不自动发布目录。`docker-compose.override.yml` 将 Compose 的 `publish_skills` 服务放入 `manual-catalog-publish` profile，普通 `docker compose up` 不会运行它。本地 WSL 环境的 `SKILLS_CATALOG_PATH` 指向 `.local-runtime/skills-catalog`；手动执行发布命令时默认读取该目录。该目录和 Compose 覆盖文件属于本机配置，不在主仓库中跟踪。明确指定发布命令的 `--repo` 或 `--ref` 仍会选择远程来源；执行发布前应先使用 `--dry-run` 检查影响。
