"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function EmptyTeamState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
      <span className="flex text-foreground-subtle">
        <Icon icon={UserGroupIcon} size={32} />
      </span>
      <Text variant="large-medium" tone="primary">
        {t("No hired experts yet", "尚未聘用专家")}
      </Text>
      <Text variant="body" tone="secondary" className="max-w-prose">
        {t(
          "Hire an expert from the marketplace and they will show up here, ready to work alongside your office assistant.",
          "从市场聘用专家后，他们会显示在这里，随时与通用办公助手协作。",
        )}
      </Text>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          as="NextLink"
          href="/marketplace"
          variant="primary"
          size="small"
        >
          {t("Browse the marketplace", "浏览市场")}
        </Button>
        <Button as="NextLink" href="/raise" variant="secondary" size="small">
          {t("Create an Expert", "创建专家")}
        </Button>
      </div>
    </div>
  );
}
