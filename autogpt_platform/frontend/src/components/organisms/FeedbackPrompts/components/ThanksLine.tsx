"use client";
import { DISPLAY_LABELS } from "../display-labels";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { CHANGELOG_BASE_URL } from "@/components/molecules/ChangelogPopup/changelog-constants";

interface Props {
  children?: string;
  withChangelog?: boolean;
}

export function ThanksLine({
  children = "Thanks, we read every one.",
  withChangelog = true,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2">
      <Icon
        icon={CheckmarkCircle02Icon}
        size={16}
        tone="success-strong"
        className="mt-[3px] shrink-0"
      />
      <Text variant="body" tone="emphasis">
        {t(children, DISPLAY_LABELS[children] ?? children)}{" "}
        {withChangelog ? (
          <Link
            href={CHANGELOG_BASE_URL}
            className="text-foreground-tertiary underline underline-offset-2"
          >
            {t("See what we've changed lately", "看看我们最近的更新")}
          </Link>
        ) : null}
      </Text>
    </div>
  );
}
