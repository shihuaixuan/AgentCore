import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  connection: ConnectionResponse;
  onEdit: () => void;
  onRemove: () => void;
  busy: boolean;
}

export function CustomMCPConnectionRow({
  connection,
  onEdit,
  onRemove,
  busy,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-base bg-surface p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <Text variant="body-medium">{connection.name}</Text>
        <div className="flex items-center gap-2">
          <Text variant="small" tone="body">
            {t("Custom MCP", "自定义 MCP")}
          </Text>
          <Text variant="small" tone="body">
            {connection.enabled
              ? t("Enabled", "已启用")
              : t("Disabled", "已停用")}
          </Text>
        </div>
        <Text variant="small" tone="body" className="break-all">
          {connection.server_url}
        </Text>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="small"
          onClick={onEdit}
          disabled={busy}
        >
          {t("Edit", "编辑")}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={onRemove}
          disabled={busy}
        >
          {t("Remove", "移除")}
        </Button>
      </div>
    </div>
  );
}
