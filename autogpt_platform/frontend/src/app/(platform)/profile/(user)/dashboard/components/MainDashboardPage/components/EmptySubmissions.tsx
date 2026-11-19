"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { InboxIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function EmptySubmissions() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-border-base bg-canvas">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-surface-hover p-3 text-foreground-tertiary">
          <Icon icon={InboxIcon} className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Text variant="large-medium" tone="primary">
            {t("No workflows submitted yet", "尚未提交任何工作流")}
          </Text>
          <Text variant="body" tone="secondary">
            {t(
              "You haven't submitted any workflows to the store yet.",
              "你尚未向市场提交任何工作流。",
            )}
            <br />
            {t(
              "Click “Submit workflow” above to get started.",
              "点击上方的“提交工作流”即可开始。",
            )}
          </Text>
        </div>
      </div>
    </div>
  );
}
