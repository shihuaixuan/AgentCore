"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { InboxIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function SubmissionLoadError() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-border-base bg-canvas">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-error-surface p-3 text-error-foreground">
          <Icon icon={InboxIcon} className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Text variant="large-medium" tone="primary">
            {t("Failed to load workflows", "加载工作流失败")}
          </Text>
          <Text variant="body" tone="secondary">
            {t(
              "Something went wrong while loading your submitted workflows.",
              "加载你提交的工作流时出现了问题。",
            )}
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => window.location.reload()}
        >
          {t("Try again", "重试")}
        </Button>
      </div>
    </div>
  );
}
