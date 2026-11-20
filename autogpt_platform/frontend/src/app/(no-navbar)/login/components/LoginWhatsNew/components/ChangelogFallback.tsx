"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { CHANGELOG_BASE_URL } from "@/components/molecules/ChangelogPopup/changelog-constants";
import { ArrowUpRight01Icon, NewsIcon } from "@hugeicons/core-free-icons";

// Shown when the changelog can't be read: the section still leads somewhere.
export function ChangelogFallback() {
  const { t } = useTranslation();
  return (
    <a
      href={CHANGELOG_BASE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl bg-surface p-4 smooth-shadow-ring-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-info focus-visible:outline-none motion-reduce:transition-none"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-surface text-accent-strong"
      >
        <Icon icon={NewsIcon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text as="span" variant="body-medium" tone="primary">
          {t("See what we've shipped lately", "查看近期更新")}
        </Text>
        <Text as="span" variant="body" tone="secondary">
          {t(
            `Release notes for ${AUTOPILOT_NAME}, your Experts and the AutoGPT Platform`,
            `${AUTOPILOT_NAME}、专家团队和 AutoGPT 平台的更新说明`,
          )}
          <span className="sr-only">
            {t("(opens in a new tab)", "（在新标签页中打开）")}
          </span>
        </Text>
      </span>
      <span
        aria-hidden
        className="shrink-0 text-foreground-tertiary transition-[color,transform] duration-150 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-foreground-strong motion-reduce:transition-none motion-reduce:group-hover:transform-none"
      >
        <Icon icon={ArrowUpRight01Icon} size={16} />
      </span>
    </a>
  );
}
