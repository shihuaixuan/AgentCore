"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  Cancel01Icon,
  InformationCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import { HeadlineText } from "@/app/(platform)/copilot/components/ApprovalQueue/components/ApprovalHeadline";
import { cn } from "@/lib/utils";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { toHomeApprovalItem } from "../attentionCopy";
import type { useReviewCarousel } from "../useReviewCarousel";
import { HeldAvatar } from "./HeldAvatar";

interface Props {
  carousel: ReturnType<typeof useReviewCarousel>;
  // Below lg the list is a sheet over the card.
  sheet?: boolean;
}

const OUTCOME_ICONS = {
  approved: [Tick02Icon, "text-success"],
  rejected: [Cancel01Icon, "text-foreground-subtle"],
  elsewhere: [InformationCircleIcon, "text-foreground-subtle"],
} as const;

export function ReviewSidebar({ carousel, sheet = false }: Props) {
  const { t, locale } = useTranslation();
  return (
    <nav
      aria-label={
        sheet
          ? t("All held calls", "所有待审核调用")
          : t("Held calls", "待审核调用")
      }
      className="flex min-h-0 w-full flex-col"
    >
      <div className="flex items-baseline gap-2 px-4 pt-4 pb-2">
        <Text variant="body-medium" as="h2">
          {t("To review", "待审核")}
        </Text>
        <Text variant="small" as="span" tone="secondary" tabular>
          {t(
            `${carousel.left} of ${carousel.total} left`,
            `共 ${carousel.total} 项，剩余 ${carousel.left} 项`,
          )}
        </Text>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        {carousel.order.map(({ item, receipt }) => {
          const isCurrent = carousel.current?.item.id === item.id;
          const outcome = receipt ? OUTCOME_ICONS[receipt.outcome] : null;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => carousel.jump(item.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 border-l-2 py-2 pr-4 pl-3.5 text-left text-body hover:bg-surface focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:outline-none focus-visible:ring-inset",
                  isCurrent
                    ? "border-action-hover bg-surface"
                    : "border-transparent",
                  receipt
                    ? "text-foreground-subtle"
                    : "text-foreground-emphasis",
                )}
              >
                <HeldAvatar item={item} size={20} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-caption text-foreground-tertiary">
                    {item.expert
                      ? getExpertDisplayTitle(item.expert, locale)
                      : AUTOPILOT_NAME}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {outcome ? (
                      <Icon
                        icon={outcome[0]}
                        size={14}
                        // oxlint-disable-next-line design-system/require-static-classes -- the outcome map holds whole, static class strings
                        className={cn("shrink-0", outcome[1])}
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 truncate">
                      <HeadlineText
                        item={toHomeApprovalItem(
                          item.review!,
                          item.expert,
                          locale,
                        )}
                      />
                      {receipt ? (
                        <span className="sr-only">, {receipt.text}</span>
                      ) : null}
                    </span>
                  </span>
                </span>
                {carousel.isNew(item.id) ? (
                  <span className="shrink-0 rounded bg-info-surface px-1.5 text-caption font-medium text-info-foreground">
                    {t("new", "新增")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-separator px-4 py-3">
        <Text variant="small" tone="secondary">
          {sheet
            ? t("Tap an item to jump to it", "点击条目以跳转")
            : t("← → move · Esc close", "← → 切换 · Esc 关闭")}
        </Text>
      </div>
    </nav>
  );
}
