"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { getTimezoneDisplayName } from "@/lib/timezone-utils";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function TimezoneNotice() {
  const { t, locale } = useTranslation();
  const userTimezone = useUserTimezone();

  if (!userTimezone) {
    return null;
  }

  if (userTimezone === "not-set") {
    return (
      <div className="mt-1 flex items-center gap-2 rounded-md border border-warning-border bg-warning-surface p-3 text-warning-foreground">
        <Icon icon={InformationCircleIcon} className="h-4 w-4" />
        <p className="text-body">
          {t(
            "No timezone set. Schedule will run in UTC.",
            "尚未设置时区。计划将按 UTC 执行。",
          )}
          <a href="/settings/account" className="ml-1 underline">
            {t("Set your timezone", "设置时区")}
          </a>
        </p>
      </div>
    );
  }

  const tzName = getTimezoneDisplayName(userTimezone || "UTC", locale);

  return (
    <div className="mt-1 flex items-center gap-2 rounded-md bg-surface-hover/50 p-3 text-foreground-tertiary">
      <Icon icon={InformationCircleIcon} className="h-4 w-4" />
      <p className="text-body">
        {t("Schedule will run in your timezone:", "计划将按你的时区运行：")}{" "}
        <span className="font-medium">{tzName}</span>
      </p>
    </div>
  );
}
