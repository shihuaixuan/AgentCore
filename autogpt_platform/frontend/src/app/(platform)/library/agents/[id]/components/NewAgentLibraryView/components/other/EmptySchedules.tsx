"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { EmptySchedulesIllustration } from "./EmptySchedulesIllustration";

export function EmptySchedules() {
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
          {t("Nothing scheduled yet", "尚未安排计划")}
        </Text>
        <Text variant="large" tone="body">
          {t(
            "Create a new run, and you'll have the option to schedule your workflow to run automatically.",
            "创建一次运行后，即可设置工作流自动运行的计划。",
          )}
        </Text>
      </div>
    </div>
  );
}
