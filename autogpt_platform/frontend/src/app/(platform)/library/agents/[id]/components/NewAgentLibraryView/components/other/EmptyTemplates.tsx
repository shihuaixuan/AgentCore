"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { EmptySchedulesIllustration } from "./EmptySchedulesIllustration";

export function EmptyTemplates() {
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
          {t("No templates yet", "暂无模板")}
        </Text>
        <Text variant="large" tone="body">
          {t(
            "Create a task first, then save it as a template to reuse later — it'll show up here.",
            "先创建任务，再将其保存为模板以便复用。模板会显示在这里。",
          )}
        </Text>
      </div>
    </div>
  );
}
