import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";

export function PaywallHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Text
        variant="h3"
        className="!text-heading-sm !leading-6.5 md:!text-heading md:!leading-10"
      >
        {t("Choose a plan to keep working", "选择套餐以继续使用")}
      </Text>
      <Text variant="body" tone="muted">
        {t(
          "Your chats, workflows and files are saved.",
          "你的对话、工作流和文件均已保存。",
        )}
      </Text>
      <Link
        href="/tour/chat?utm_source=platform_paywall"
        target="_blank"
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-accent-surface/60 px-4 py-1.5 text-body text-foreground-body transition-colors hover:bg-brand/5"
      >
        <Icon icon={PlayCircleIcon} tone="brand" className="size-5 shrink-0" />
        <span>{t("Explore a quick demo", "查看快速演示")}</span>
      </Link>
    </div>
  );
}
("use client");

import { useTranslation } from "@/lib/i18n/LanguageProvider";
