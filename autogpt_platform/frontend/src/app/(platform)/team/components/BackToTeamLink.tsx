"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

export function BackToTeamLink() {
  const { t } = useTranslation();
  return (
    <Link
      href="/team"
      className="group inline-flex items-center gap-1 text-foreground-tertiary hover:text-foreground-emphasis"
      data-testid="expert-back-to-team"
    >
      <Icon icon={ArrowLeft02Icon} size={14} />
      <Text variant="body" as="span" tone="inherit">
        {t("Back to Team", "返回团队")}
      </Text>
    </Link>
  );
}
