"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import { useCopilotModal } from "../../useCopilotModal";
import { ConnectorRow } from "./ConnectorRow";
import { McpConnectorRow } from "./McpConnectorRow";
import type { ConnectorRow as Row, McpConnectorRequest } from "./helpers";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  rows: Row[];
  mcp: McpConnectorRequest[];
}

export function ConnectionsSection({ rows, mcp }: Props) {
  const { t } = useTranslation();
  const { openModal } = useCopilotModal();
  const mcpRows = mcp.filter(
    (request, i) =>
      mcp.findIndex((other) => other.serverUrl === request.serverUrl) === i,
  );
  const remaining = [
    ...rows
      .filter((row) => !row.selected || row.hasUnansweredTarget)
      .map((row) => row.displayName),
    ...mcpRows
      .filter((request) => !request.connected)
      .map((request) => request.service),
  ];
  return (
    <div className="overflow-hidden rounded-3xl border border-separator bg-surface">
      <div className="flex items-center gap-3 border-b border-separator px-4 py-5">
        <Icon icon={PlugSocketIcon} size={18} tone="subtle" />
        <div className="min-w-0 flex-1">
          <Text variant="large-medium-tight" as="h3" tone="primary">
            {remaining.length
              ? t("Connect your apps", "连接你的应用")
              : t("Your apps are connected", "你的应用已连接")}
          </Text>
          <Text variant="body-tight" tone="muted" className="mt-1">
            {t(
              "Choose the accounts Otto should use.",
              "选择供 Otto 使用的账户。",
            )}
          </Text>
        </div>
        <span
          role="status"
          className="shrink-0 rounded-full border border-separator px-2.5 py-1 text-caption text-foreground-tertiary"
        >
          {t(
            `${rows.length + mcpRows.length - remaining.length} of ${rows.length + mcpRows.length} ready`,
            `${rows.length + mcpRows.length - remaining.length} / ${rows.length + mcpRows.length} 已就绪`,
          )}
        </span>
      </div>
      {rows.map((row) => (
        <ConnectorRow key={row.key ?? row.provider} row={row} />
      ))}
      {mcpRows.map((request) => (
        <McpConnectorRow key={request.id} request={request} />
      ))}
      {remaining.length > 0 && rows.length + mcpRows.length > 1 && (
        <div className="border-t border-separator px-4 py-2.5">
          <Text variant="body-tight" as="span" tone="muted">
            {t(
              `Still to connect: ${remaining.join(", ")}`,
              `尚待连接：${remaining.join("、")}`,
            )}
          </Text>
        </div>
      )}
      <div className="space-y-2 border-t border-separator bg-surface-muted px-4 py-3">
        <Text variant="body-tight" tone="muted">
          {remaining.length
            ? t(
                "Once these apps are connected, Otto will continue.",
                "连接这些应用后，Otto 将继续处理。",
              )
            : t(
                "Connections are ready. Otto can continue setting up your workflow.",
                "连接已就绪，Otto 可以继续配置你的工作流。",
              )}
        </Text>
        <Text variant="body-tight" as="span" tone="muted">
          {t("Looking for something else?", "需要其他应用？")}{" "}
          <button
            type="button"
            onClick={() => openModal("integrations")}
            className="font-medium text-foreground-strong underline underline-offset-2"
          >
            {t("Browse all connectors", "浏览所有连接器")}
          </button>
        </Text>
      </div>
    </div>
  );
}
