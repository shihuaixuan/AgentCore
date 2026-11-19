"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { GraphTriggerInfo } from "@/app/api/__generated__/models/graphTriggerInfo";
import { LibraryAgentPreset } from "@/app/api/__generated__/models/libraryAgentPreset";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { RunDetailCard } from "../../RunDetailCard/RunDetailCard";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  template: LibraryAgentPreset;
  triggerSetupInfo: GraphTriggerInfo;
}

function getTriggerStatus(
  template: LibraryAgentPreset,
): "active" | "inactive" | "broken" {
  if (!template.webhook_id || !template.webhook) return "broken";
  return template.is_active ? "active" : "inactive";
}

export function WebhookTriggerCard({ template, triggerSetupInfo }: Props) {
  const { t } = useTranslation();
  const status = getTriggerStatus(template);
  const webhook = template.webhook;

  function handleCopyWebhookUrl() {
    if (webhook?.url) {
      navigator.clipboard.writeText(webhook.url);
    }
  }

  return (
    <RunDetailCard title={t("Trigger Status", "触发器状态")}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Text variant="large-medium">{t("Status", "状态")}</Text>
          <span
            className={`rounded-full px-2 py-0.5 text-caption font-medium ${
              status === "active"
                ? "bg-success/30 text-success-foreground"
                : status === "inactive"
                  ? "bg-warning-border text-yellow-foreground"
                  : "bg-error-surface text-error-foreground"
            }`}
          >
            {status === "active"
              ? t("Active", "已启用")
              : status === "inactive"
                ? t("Inactive", "已停用")
                : t("Broken", "异常")}
          </span>
        </div>

        {!template.webhook_id ? (
          <Text variant="body" tone="danger">
            {t(
              'This trigger is not attached to a webhook. Use "Set up trigger" to fix this.',
              "此触发器尚未关联 Webhook。请使用“设置触发器”来修复。",
            )}
          </Text>
        ) : !triggerSetupInfo.credentials_input_name && webhook ? (
          <div className="flex flex-col gap-2">
            <Text variant="body">
              {t(
                "This trigger is ready to be used. Use the Webhook URL below to set up the trigger connection with the service of your choosing.",
                "此触发器已准备就绪。使用下方的 Webhook 地址，与所选服务建立触发连接。",
              )}
            </Text>
            <div className="flex flex-col gap-1">
              <Text variant="body-medium">
                {t("Webhook URL:", "Webhook 地址：")}
              </Text>
              <div className="flex gap-2 rounded-md bg-surface-muted p-2">
                <code className="ph-no-capture flex-1 text-body select-all">
                  {webhook.url}
                </code>
                <Button
                  variant="outline"
                  size="icon-xs"
                  shape="pill"
                  className="flex-none"
                  onClick={handleCopyWebhookUrl}
                  title={t("Copy webhook URL", "复制 Webhook 链接")}
                >
                  <Icon icon={Copy01Icon} className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Text variant="body" tone="muted">
            {t("This workflow trigger is", "此工作流触发器")}{" "}
            {template.is_active
              ? t(
                  "ready. When a trigger is received, it will run with the provided settings.",
                  "已就绪，收到触发事件后将按提供的设置运行。",
                )
              : t(
                  "disabled. It will not respond to triggers until you enable it.",
                  "已停用，启用之前不会响应触发事件。",
                )}
          </Text>
        )}
      </div>
    </RunDetailCard>
  );
}
