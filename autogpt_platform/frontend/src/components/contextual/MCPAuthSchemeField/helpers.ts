import type { MCPAuthScheme } from "@/lib/mcp-auth";

export function mcpAuthTokenLabel(
  scheme: MCPAuthScheme,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  return scheme === "basic"
    ? t("Basic authentication token", "基本身份验证令牌")
    : t("API token", "API 令牌");
}

export function mcpAuthTokenHint(
  scheme: MCPAuthScheme,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  return scheme === "basic"
    ? t(
        'Paste the Base64 of user:password — the value after "Basic" — or the complete Authorization header.',
        "粘贴 user:password 的 Base64 编码，即“Basic”之后的值，或完整的 Authorization 请求头。",
      )
    : t(
        "Paste the token itself. AutoGPT sends it using Bearer authentication.",
        "粘贴令牌本身。AutoGPT 会使用 Bearer 身份验证发送此令牌。",
      );
}

export function mcpAuthTokenPlaceholder(
  scheme: MCPAuthScheme,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  return scheme === "basic"
    ? t("Paste Base64 of user:password", "粘贴 user:password 的 Base64 编码")
    : t("Paste API token", "粘贴 API 令牌");
}
