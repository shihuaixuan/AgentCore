"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { BillingOffer } from "../BillingOffer";
import { AutopilotUsageCard } from "../AutopilotUsageCard/AutopilotUsageCard";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";

import {
  formatCents,
  formatShortDate,
  getSectionMotionProps,
} from "../../../helpers";
import { CycleToggle } from "./CycleToggle";
import { SwitchCycleDialog } from "./SwitchCycleDialog";
import { SwitchTierDialog } from "./SwitchTierDialog";
import { ENTERPRISE_CONTACT_URL, useYourPlanCard } from "./useYourPlanCard";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  index?: number;
  showUsage?: boolean;
}

export function YourPlanCard({ index = 0, showUsage = false }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const controller = useYourPlanCard();
  const {
    plan,
    isError,
    retry,
    isLoading,
    isUpdatingTier,
    isRedirecting,
    canManagePortal,
    canUpgrade,
    canDowngrade,
    canResume,
    selectedCycle,
    pendingCycle,
    pendingTierUpgrade,
    pendingTierUpgradeLabel,
    pendingTierDowngrade,
    pendingTierDowngradeLabel,
    isCycleToggleVisible,
    cycleDialogTitle,
    cycleDialogBody,
    tierUpgradeDialogBody,
    tierDowngradeDialogBody,
    onCycleChange,
    onConfirmCycleSwitch,
    onCancelCycleSwitch,
    onConfirmTierUpgrade,
    onCancelTierUpgrade,
    onConfirmTierDowngrade,
    onCancelTierDowngrade,
    onUpgrade,
    onDowngrade,
    onResume,
    onManage,
  } = controller;

  const sectionMotion = getSectionMotionProps(index, Boolean(reduceMotion));

  if (plan?.tierKey === "TRIAL") return null;
  if (isError) return <ErrorCard context="your subscription" onRetry={retry} />;

  if (isLoading || !plan) {
    return (
      <motion.div {...sectionMotion}>
        <Skeleton className="h-[100px] rounded-2xl" />
      </motion.div>
    );
  }

  const planBadgeLabel = !plan.isPaidPlan
    ? t("Inactive", "未启用")
    : plan.isPendingCancel
      ? t("Cancellation scheduled", "已安排取消")
      : plan.isPendingDowngrade
        ? t("Downgrade scheduled", "已安排降级")
        : plan.isPendingCycleSwitch
          ? t("Cycle switch scheduled", "已安排周期切换")
          : t("Active", "有效");

  return (
    <motion.section {...sectionMotion} className="flex w-full flex-col gap-4">
      <div className="sr-only">
        <Text variant="body-medium" as="span">
          {t("Your plan", "你的套餐")}
        </Text>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="large-semibold" as="h2">
              {plan.label}
            </Text>
            {plan.isPendingCancel ||
            plan.isPendingDowngrade ||
            plan.isPendingCycleSwitch ? (
              <Badge variant="warning" size="small">
                {planBadgeLabel}
              </Badge>
            ) : (
              <Badge
                variant="success"
                size="small"
                // oxlint-disable-next-line design-system/no-restyle -- the plan badge is brand-tinted; Badge has no brand tint
                className="bg-brand/10 text-accent-strong"
              >
                {planBadgeLabel}
              </Badge>
            )}
            {isCycleToggleVisible ? (
              <CycleToggle
                value={selectedCycle}
                onChange={onCycleChange}
                disabled={isUpdatingTier || isRedirecting}
              />
            ) : null}
          </div>
          {plan.isAdminManaged ? (
            <Text variant="body" as="span" tone="body">
              Managed by your AutoGPT account team.{" "}
              <a
                href={ENTERPRISE_CONTACT_URL}
                className="font-medium text-brand no-underline hover:text-brand-hover"
              >
                {t("Contact us", "联系我们")}
              </a>{" "}
              for changes.
            </Text>
          ) : plan.isPaidPlan ? (
            <Text variant="body" as="span" tone="body">
              {formatCents(plan.monthlyCostCents)}
              {plan.billingCycle === "yearly"
                ? t(" / year", " / 年")
                : t(" / month", " / 月")}
              {plan.isPendingCancel && plan.pendingEffectiveAt
                ? t(
                    ` · Ends on ${formatShortDate(plan.pendingEffectiveAt)}`,
                    ` · 于 ${formatShortDate(plan.pendingEffectiveAt)} 结束`,
                  )
                : plan.isPendingDowngrade && plan.pendingEffectiveAt
                  ? t(
                      ` · Switches to ${plan.pendingTierLabel} on ${formatShortDate(plan.pendingEffectiveAt)}`,
                      ` · 于 ${formatShortDate(plan.pendingEffectiveAt)} 切换至 ${plan.pendingTierLabel}`,
                    )
                  : plan.isPendingCycleSwitch && plan.pendingEffectiveAt
                    ? t(
                        ` · Active until ${formatShortDate(plan.pendingEffectiveAt)}`,
                        ` · 有效期至 ${formatShortDate(plan.pendingEffectiveAt)}`,
                      )
                    : plan.currentPeriodEnd
                      ? t(
                          ` · Renews on ${formatShortDate(plan.currentPeriodEnd * 1000)}`,
                          ` · 于 ${formatShortDate(plan.currentPeriodEnd * 1000)} 续订`,
                        )
                      : null}
            </Text>
          ) : (
            <Text variant="body" as="span" tone="body">
              Pick a plan to continue using AutoGPT.
            </Text>
          )}
          {plan.isPaidPlan &&
          plan.isPendingCycleSwitch &&
          plan.pendingEffectiveAt &&
          plan.pendingCycle ? (
            <Text variant="small" as="span" tone="muted">
              Switching to {plan.pendingCycle} {plan.label} on{" "}
              {formatShortDate(plan.pendingEffectiveAt)} · No charge today
            </Text>
          ) : null}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canResume ? (
            <Button
              variant="primary"
              size="small"
              onClick={onResume}
              disabled={isUpdatingTier || isRedirecting}
              loading={isUpdatingTier}
            >
              {plan.isPendingCancel
                ? t("Resume subscription", "恢复订阅")
                : plan.isPendingCycleSwitch
                  ? t("Cancel cycle switch", "取消周期切换")
                  : t("Cancel downgrade", "取消降级")}
            </Button>
          ) : null}
          {canDowngrade && plan.previousTierLabel ? (
            <Button
              variant="outline"
              size="small"
              onClick={onDowngrade}
              disabled={isUpdatingTier || isRedirecting}
              loading={isUpdatingTier}
            >
              Downgrade to {plan.previousTierLabel}
            </Button>
          ) : null}
          {plan.isPaidPlan && !plan.isAdminManaged ? (
            <Button
              variant="secondary"
              size="small"
              onClick={onManage}
              disabled={!canManagePortal}
            >
              {t("Manage subscription", "管理订阅")}
            </Button>
          ) : null}
          {canUpgrade &&
          plan.nextTierLabel &&
          (!showUsage || !plan.isPaidPlan) ? (
            <Button
              variant="primary"
              size="small"
              onClick={onUpgrade}
              disabled={isUpdatingTier || isRedirecting}
              loading={isUpdatingTier && !plan.nextTierIsTeamLink}
              rightIcon={
                plan.nextTierIsTeamLink ? (
                  <Icon icon={LinkSquare01Icon} size={14} aria-hidden="true" />
                ) : undefined
              }
            >
              {!plan.isPaidPlan
                ? t(
                    `Start ${plan.nextTierLabel}`,
                    `开始使用 ${plan.nextTierLabel}`,
                  )
                : plan.nextTierIsTeamLink
                  ? t(
                      `Talk to sales — ${plan.nextTierLabel}`,
                      `联系销售 — ${plan.nextTierLabel}`,
                    )
                  : t(
                      `Upgrade to ${plan.nextTierLabel}`,
                      `升级至 ${plan.nextTierLabel}`,
                    )}
            </Button>
          ) : null}
        </div>
      </div>

      {showUsage ? (
        <div className="grid items-stretch gap-4 md:grid-cols-[1.15fr_1fr]">
          <AutopilotUsageCard index={1} />
          <BillingOffer controller={controller} />
        </div>
      ) : null}

      {pendingCycle ? (
        <SwitchCycleDialog
          isOpen={pendingCycle !== null}
          onOpenChange={(open) => {
            if (!open) onCancelCycleSwitch();
          }}
          targetCycle={pendingCycle}
          title={cycleDialogTitle || undefined}
          body={cycleDialogBody}
          isSaving={isUpdatingTier}
          onConfirm={onConfirmCycleSwitch}
        />
      ) : null}

      {pendingTierUpgrade && pendingTierUpgradeLabel ? (
        <SwitchTierDialog
          isOpen={pendingTierUpgrade !== null}
          onOpenChange={(open) => {
            if (!open) onCancelTierUpgrade();
          }}
          targetTierLabel={pendingTierUpgradeLabel}
          body={tierUpgradeDialogBody}
          priceCents={controller.offerPriceCents}
          billingCycle={plan.billingCycle}
          usageCarriesOver={
            plan.tierKey === "PRO" && pendingTierUpgrade === "MAX"
          }
          usageMultiplier={controller.upgradeUsageMultiplier}
          upgradeReview={controller.upgradeReview}
          isSaving={isUpdatingTier}
          onConfirm={onConfirmTierUpgrade}
        />
      ) : null}

      {pendingTierDowngrade && pendingTierDowngradeLabel ? (
        <SwitchTierDialog
          isOpen={pendingTierDowngrade !== null}
          onOpenChange={(open) => {
            if (!open) onCancelTierDowngrade();
          }}
          targetTierLabel={pendingTierDowngradeLabel}
          title={t(
            `Downgrade to ${pendingTierDowngradeLabel}?`,
            `降级至 ${pendingTierDowngradeLabel}？`,
          )}
          confirmLabel={t(
            `Downgrade to ${pendingTierDowngradeLabel}`,
            `降级至 ${pendingTierDowngradeLabel}`,
          )}
          body={tierDowngradeDialogBody}
          isSaving={isUpdatingTier}
          onConfirm={onConfirmTierDowngrade}
        />
      ) : null}
    </motion.section>
  );
}
