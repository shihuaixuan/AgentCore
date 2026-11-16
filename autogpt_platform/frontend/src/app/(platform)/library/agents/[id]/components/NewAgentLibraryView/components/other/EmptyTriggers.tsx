"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { EmptySchedulesIllustration } from "./EmptySchedulesIllustration";

export function EmptyTriggers() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-20">
      <EmptySchedulesIllustration />
      <div className="flex flex-col items-center gap-2">
        <Text
          variant="h4"
          // oxlint-disable-next-line design-system/no-restyle -- no heading variant keeps the parent line height; h4 alone would move the empty state by 9px
          className="text-center leading-inherit"
        >
          {t("No triggers yet", "暂无触发器")}
        </Text>
        <Text variant="large" tone="body">
          {t(
            "Set up automatic triggers for your workflow to run tasks automatically — they'll show up here.",
            "为工作流设置自动触发器以自动执行任务，触发器会显示在这里。",
          )}
        </Text>
      </div>
    </div>
  );
}
