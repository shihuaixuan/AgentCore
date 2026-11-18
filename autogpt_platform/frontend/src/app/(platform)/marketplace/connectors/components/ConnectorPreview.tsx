import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import type { ConnectableProvider } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  provider: ConnectableProvider;
  onClose: () => void;
}

export function ConnectorPreview({ provider, onClose }: Props) {
  const { t } = useTranslation();
  const next = `/marketplace/connectors?${new URLSearchParams({ q: provider.id })}`;

  return (
    <Dialog
      title={provider.name}
      controlled={{
        isOpen: true,
        set: (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-3 px-2 pb-2">
          {provider.description && (
            <Text variant="body">{provider.description}</Text>
          )}
          {provider.mcpServer && (
            <Text variant="body" tone="muted">
              {provider.mcpServer.connection_mode === "hosted"
                ? t(
                    "This service has a hosted MCP server.",
                    "此服务提供托管的 MCP 服务器。",
                  )
                : t(
                    "This MCP server needs additional setup.",
                    "此 MCP 服务器需要额外配置。",
                  )}
            </Text>
          )}
          <div className="flex justify-end">
            <Button
              as="NextLink"
              href={`/login?next=${encodeURIComponent(next)}`}
              size="small"
            >
              {t("Sign in to connect", "登录后连接")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
