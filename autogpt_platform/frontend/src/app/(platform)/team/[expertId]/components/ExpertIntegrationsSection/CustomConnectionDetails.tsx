import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  connections: ConnectionResponse[];
}

export function CustomConnectionDetails({ connections }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {connections.map((connection) => (
        <div key={connection.id}>
          <Text variant="small" tone="muted" className="break-all">
            {connection.server_url}
            {connection.enabled === false
              ? ` · ${t("Disabled", "已禁用")}`
              : ""}
          </Text>
          <Text variant="small" tone="muted">
            {connection.auth_type === "bearer"
              ? t("Bearer token configured", "已配置 Bearer 密钥")
              : connection.auth_type === "basic"
                ? t("Basic authentication configured", "已配置 Basic 认证")
                : t("Connected via OAuth", "已通过 OAuth 连接")}
          </Text>
        </div>
      ))}
      {connections.length > 1 && (
        <Text variant="small" tone="muted">
          {t(
            "Shared credential: access applies to all listed connections.",
            "共享凭据：添加或移除权限将影响以上所有连接。",
          )}
        </Text>
      )}
    </>
  );
}
