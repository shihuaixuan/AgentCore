# Maintaining MCP Integrations

[`mcp_catalog.json`](../../autogpt_platform/backend/backend/integrations/mcp_catalog.json) defines the official services shown in Integrations and the AutoPilot MCP guide. [`mcp_catalog.py`](../../autogpt_platform/backend/backend/integrations/mcp_catalog.py) validates the records and exposes them through `get_mcp_catalog()`.

## Add or update a service

- Keep a stable `mcp_...` ID and link directly to the vendor's setup documentation.
- Describe the server's purpose and required plan, admin approval, region, endpoint, and credentials in `description` and `setup_instructions`.
- Choose the connection setup that matches the vendor's server; see [Choose how users connect](#choose-how-users-connect).
- Order the supported `auth_methods` by preference; the first method is selected initially. Choices are `oauth`, `bearer`, `basic`, and `none`.
- Set `oauth_server_url` when the vendor supplies a separate signed-in endpoint.
- Set documented `oauth_scopes` to cover what the server's tools need, write scopes included. The vendor refuses any call the grant doesn't cover, and whether a covered call asks first is the effect map's job, so don't withhold write scopes to prevent changes. An empty list omits the scope parameter; omission/null uses discovery defaults, which are the resource's `scopes_supported`, else the authorization server's.
- Set `oauth_request_all_scopes` instead when the resource lists only a minimum and adds the rest through step-up authorization, which our client doesn't do. Sign-in then requests every scope the authorization server advertises, so the list can't go stale, and the vendor's consent screen lets the user narrow it. Example: Cloudflare.
- List the server's tools in [`mcp_effects.json`](../../autogpt_platform/backend/backend/integrations/mcp_effects.json) as `read`, `external` or `irreversible`, named exactly as the vendor's published tool list names them. Pick the more cautious class when the docs are unclear; the Auto Mode gate treats unlisted tools as external. Map a catch-all tool that both reads and writes, such as Cloudflare's `execute`, as `external`: `irreversible` would mark every read as permanent and rule out approving several calls at once. Set `review_when_gate_inactive: true` to also require review of any tool not marked `read` when the Auto Mode gate is unavailable.

## Choose how users connect

Match the entry to where the vendor runs its MCP server. Every URL must be a public HTTPS URL.

- **One public URL for every customer:** use `connection_mode: hosted` with `server_url`. The connect dialog shows the URL locked, and AutoPilot uses it. Examples: PostHog, Notion.
- **One public URL, and the service can also be self-hosted:** use `hosted` with `server_url` and `allow_custom_url: true`. The dialog opens on `server_url`, and users can replace it with their own instance's URL. AutoPilot still uses `server_url`. Say in `setup_instructions` how to connect a self-hosted instance, including any sign-in setup it needs. Example: OpenSEO.
- **A separate URL per region:** use `connection_mode: custom` with one `server_url_options` entry per region and no `server_url`. Users pick their region, and the picker's **Custom URL** option covers self-hosted instances. Prefer this to one entry per region. Don't make it a hosted entry that defaults to one region, because users in the other regions would connect to the wrong one. Examples: Amplitude, Langfuse.
- **A URL unique to each customer account:** use `connection_mode: custom` with no `server_url` and no options. Say in `setup_instructions` where users find their URL. The dialog opens with an empty URL field. Examples: Chargebee, Sourcegraph.

Both `custom` setups show **Setup required** in the integrations list. AutoPilot tells users to add their URL under Settings → Integrations before it can use the server.

## Validate the change

Check the vendor's current endpoint and authentication contract. Verify initialization and tool listing with the MCP client, then a benign read using the intended permissions. For OAuth, check registration, consent, and refresh with the deployment's callback and an authorized test account.

Update affected catalog, provider, guide, and page integration tests. Cover changes to region selection, custom URLs, token handling, or optional grants. Regenerate API types when the metadata schema changes, and run the relevant backend and frontend checks.

## Local Chinese office service selection

The five hosted HTTPS services below accept a manually entered Bearer credential.
企查查 and 知产宝 also
offer browser sign-in on the same card. Catalog entries contain setup
instructions, not user credentials or active connections.

| Service | Catalog ID | Credential preparation |
| --- | --- | --- |
| WPS 云文档 | `mcp_wps_yundoc` | Create a WPS 365 application, request cloud document MCP permissions, obtain a user access token, and disable interface signing. App AK/SK is not the Bearer token. |
| ProcessOn | `mcp_processon` | Obtain an MCP Token from an enabled account on the vendor's limited-access gray environment. |
| 企查查 | `mcp_qcc_company` | Sign in via OAuth, or create an API Key on the agent data platform. This entry connects only the company data service. |
| Gitee | `mcp_gitee` | Create a personal access token with permissions for the intended repositories and operations. |
| 知产宝 | `mcp_iphouse` | Sign in via OAuth, or obtain an API Key from the vendor. Access follows the account's entitlement. |

Both OAuth endpoints advertise dynamic client registration, PKCE S256, and
`mcp:tools`. Both accepted `http://localhost:3000/auth/integrations/mcp_callback`
for registration and served an authorization page. User consent, code exchange,
and authenticated tool calls were not tested. Use Bearer if sign-in is unavailable;
for a public 企查查 deployment, register the HTTPS callback with the vendor.
WPS documents its own user authorization flow for obtaining the Bearer access
token; the selected MCP endpoint does not advertise a compatible OAuth flow.

On 2026-11-19, unauthenticated `initialize` and `tools/list` succeeded for WPS,
ProcessOn, and Gitee. This verifies protocol discovery, not access to user data.
企查查 and 知产宝 returned HTTP 401, so authenticated discovery and business
operations remain unverified. Their effect maps deliberately contain no tool
classifications: unknown tools keep the existing approval behavior. ProcessOn
generation is classified as external because it can create artifacts or consume
account quota. No business tool was invoked during catalog validation.

When the deployment uses `MCPMarketplaceEntry`, changing the bundled JSON alone
does not update its database snapshot. Publish only the selected entries with
`publish_mcp_catalog(entries, source)` against the intended initialized database,
then restart the backend to load that snapshot. Preserve other marketplace entries
and user credentials. If the database has no project tables, restore the intended
local runtime before publishing; do not initialize a different database merely to
import connector metadata.

## DingTalk marketplace connections

Open Settings → Integrations → Browse connectors and search for `钉钉`.
Each service publishes a separate OAuth address in the DingTalk AI market, so
users can authorize the services they need independently.

| Service | Catalog ID |
| --- | --- |
| [钉钉待办](https://aihub.dingtalk.com/#/detail?mcpId=2034&detailType=marketMcpDetail) | `mcp_dingtalk_todo` |
| [钉钉日历](https://aihub.dingtalk.com/#/detail?mcpId=1050&detailType=marketMcpDetail) | `mcp_dingtalk_calendar` |
| [钉钉文档](https://aihub.dingtalk.com/#/detail?mcpId=9629&detailType=marketMcpDetail) | `mcp_dingtalk_docs` |
| [钉钉 AI 表格](https://aihub.dingtalk.com/#/detail?mcpId=9555&detailType=marketMcpDetail) | `mcp_dingtalk_aitable` |

The gateway advertises the `user` scope, PKCE S256, and dynamic client
registration with `client_secret_post`. Registration accepted
`http://localhost:3000/auth/integrations/mcp_callback`, and the AI Tables
endpoint reached DingTalk's authorization flow. Consent, code exchange and
authenticated tool calls still need an authorized DingTalk account. Available
data and tools depend on the DingTalk user and organization.

The [personal URL flow](https://help.aliyun.com/zh/model-studio/connector/dingtalk)
is separate. It embeds a credential in a `key` query parameter, which the custom
MCP form does not accept. Use the catalog's Connect button for the OAuth flow.

[腾讯云元宝搜索](https://cloud.tencent.com/developer/mcp/server/11764)
(`mcp_tencent_yuanbao_search`) uses a Yuanbao Search API Key as a Bearer token.
Its `SearchPro` tool can consume account quota and is classified as `external`.
The five entries use their effect maps even when the Auto Mode gate is unavailable:
Otto asks for review on calls that aren't documented reads.
