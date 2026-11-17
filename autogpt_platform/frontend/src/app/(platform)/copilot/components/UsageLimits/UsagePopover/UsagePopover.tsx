"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/molecules/Popover/Popover";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatTierLabel, TIER_BADGE_CLASS_NAME } from "../../usageHelpers";
import { UsageMeter } from "@/components/organisms/UsageExperience/UsageMeter";
import { formatUsageDate } from "@/services/usageExperience/helpers";
import { StorageBar } from "../StorageBar";
import { UsageBar } from "../UsageBar";
import { useUsagePopover } from "./useUsagePopover";
import { GaugeIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  trigger?: ReactNode;
  align?: "start" | "center" | "end";
}

export function UsagePopover({ trigger, align = "start" }: Props) {
  const { t } = useTranslation();
  const { usage, experience, isLoading, isError, retry, isBillingEnabled } =
    useUsagePopover();

  if (isLoading) return null;
  if (!isError && !usage?.daily && !usage?.weekly && !experience.isActiveTrial)
    return null;

  const tierLabel = formatTierLabel(experience.tier);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Usage limits", "用量限制")}
          >
            <Icon icon={GaugeIcon} className="!size-5" />
          </Button>
        )}
      </PopoverTrigger>
      {/* z-[80]: must layer above the mobile sidebar sheet so the popover
          doesn't render under its overlay. */}
      <PopoverContent align={align} className="z-[80] w-72 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Text tone="emphasis" variant="body-medium">
              {t("Usage limits", "用量限制")}
            </Text>
            {tierLabel && (
              <Badge
                variant="info"
                size="small"
                className={TIER_BADGE_CLASS_NAME}
              >
                {tierLabel}
              </Badge>
            )}
          </div>
          {isError && (
            <div>
              <Text variant="small">
                {t("We couldn’t check your usage.", "无法查询你的用量。")}
              </Text>
              <Button size="small" variant="ghost" onClick={() => void retry()}>
                {t("Try again", "重试")}
              </Button>
            </div>
          )}
          {!isError &&
            experience.isActiveTrial &&
            experience.trialPercent !== null && (
              <UsageMeter
                label={t("Trial allowance", "试用额度")}
                percent={experience.trialPercent}
                detail={
                  experience.trialEndsAt
                    ? t(
                        `Trial ends ${formatUsageDate(experience.trialEndsAt)}`,
                        `试用将于 ${formatUsageDate(experience.trialEndsAt)} 结束`,
                      )
                    : t("Your allowance for this trial", "本次试用的可用额度")
                }
              />
            )}
          {!isError && !experience.isLifetimeTrial && usage?.daily && (
            <UsageBar
              label={t("Today", "今日")}
              percentUsed={usage.daily.percent_used}
              resetsAt={usage.daily.resets_at}
            />
          )}
          {!isError && !experience.isLifetimeTrial && usage?.weekly && (
            <UsageBar
              label={t("This week", "本周")}
              percentUsed={usage.weekly.percent_used}
              resetsAt={usage.weekly.resets_at}
            />
          )}
          <StorageBar />
          {isBillingEnabled && (
            <Link
              href="/settings/billing"
              className="text-body text-info-foreground hover:underline"
            >
              {t("Manage billing", "管理账单")}
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
