import { formatProviderName } from "@/components/contextual/IntegrationsPanel/helpers";
import type { Locale } from "@/lib/i18n/locale";

const providerNames: Record<string, [string, string]> = {
  database: ["Database", "数据库"],
  dingtalk: ["DingTalk", "钉钉"],
  feishu: ["Feishu", "飞书"],
  google_maps: ["Google Maps", "Google 地图"],
  http: ["HTTP", "HTTP"],
  mcp: ["MCP", "MCP"],
  smtp: ["SMTP", "SMTP"],
};

export function getIntegrationLabel(provider: string, locale: Locale) {
  const names = providerNames[provider];
  return names?.[locale === "zh-CN" ? 1 : 0] ?? formatProviderName(provider);
}
