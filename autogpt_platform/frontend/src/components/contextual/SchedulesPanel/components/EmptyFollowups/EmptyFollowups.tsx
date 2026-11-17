"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function EmptyFollowups() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-base px-6 py-16 text-center"
      data-testid="followups-empty"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-surface">
        <Icon
          icon={Calendar03Icon}
          size={24}
          className="text-yellow-foreground"
        />
      </div>
      <Text variant="h4" tone="primary">
        {t("Nothing scheduled yet", "暂无定时任务")}
      </Text>
      <Text variant="body" tone="muted" className="max-w-md">
        {t(
          "Your experts' scheduled follow-ups and recurring workflow runs show up here. Select New scheduled task to set one up, or schedule a workflow from the builder.",
          "专家的定时跟进和周期性工作流运行会显示在此处。选择“新建定时任务”进行设置，或在构建器中为工作流设置运行计划。",
        )}
      </Text>
    </div>
  );
}
