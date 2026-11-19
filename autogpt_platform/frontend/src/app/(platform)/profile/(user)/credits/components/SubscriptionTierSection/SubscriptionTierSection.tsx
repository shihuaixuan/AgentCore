"use client";
import { Text } from "@/components/atoms/Text/Text";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { useSubscriptionTierSection } from "./useSubscriptionTierSection";
import { PendingChangeBanner } from "./components/PendingChangeBanner/PendingChangeBanner";
import {
  TIERS,
  TIER_ORDER,
  formatCost,
  formatPendingDate,
  formatRelativeMultiplier,
  getTierLabel,
} from "./helpers";

export function SubscriptionTierSection() {
  const { t, locale } = useTranslation();
  const {
    subscription,
    isLoading,
    error,
    tierError,
    isPending,
    pendingTier,
    pendingUpgradeTier,
    setPendingUpgradeTier,
    confirmUpgrade,
    isPaymentEnabled,
    changeTier,
    handleTierChange,
    cancelPendingChange,
  } = useSubscriptionTierSection();
  const [confirmDowngradeTo, setConfirmDowngradeTo] = useState<string | null>(
    null,
  );
  const [confirmReplacePendingTo, setConfirmReplacePendingTo] = useState<
    string | null
  >(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Text variant="lead-medium" as="h3" tone="inherit">
          {t("Subscription Plan", "订阅套餐")}
        </Text>
        <div
          role="alert"
          className="rounded-md border border-error/20 bg-error-surface px-3 py-2 text-error-foreground"
        >
          <Text variant="body-tight" as="p" tone="inherit">
            {error}
          </Text>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  const currentTier = subscription.tier;
  const periodEnd = subscription.current_period_end
    ? formatPendingDate(
        new Date(subscription.current_period_end * 1000),
        locale,
      )
    : null;
  const tierDescriptions: Record<string, string> = {
    BASIC: "基础专家容量与标准速率上限",
    PRO: "为每天或每周运行更多任务提供专家容量",
    MAX: "扩展专家容量，适合高强度使用者",
    BUSINESS: "面向团队和高负载任务的专家容量",
  };

  if (currentTier === "ENTERPRISE") {
    return (
      <div className="space-y-4">
        <Text variant="lead-medium" as="h3" tone="inherit">
          {t("Subscription Plan", "订阅套餐")}
        </Text>
        <div className="rounded-lg border border-brand bg-accent-surface p-4 text-accent-strong">
          <Text variant="large-semibold-tight" as="p" tone="inherit">
            {t("Enterprise Plan", "Enterprise 套餐")}
          </Text>
          <Text variant="body-tight" as="p" tone="secondary" className="mt-1">
            {t(
              "Your Enterprise plan is managed by your administrator. Contact your account team for changes.",
              "你的 Enterprise 套餐由管理员管理。如需更改，请联系账户团队。",
            )}
          </Text>
        </div>
      </div>
    );
  }

  async function confirmDowngrade() {
    if (!confirmDowngradeTo) return;
    const tier = confirmDowngradeTo;
    setConfirmDowngradeTo(null);
    await changeTier(tier);
  }

  async function confirmReplacePending() {
    if (!confirmReplacePendingTo) return;
    const tier = confirmReplacePendingTo;
    setConfirmReplacePendingTo(null);
    handleTierChange(tier, currentTier, setConfirmDowngradeTo);
  }

  const pendingTierFromSubscription = subscription.pending_tier ?? null;
  const hasPendingChange =
    pendingTierFromSubscription !== null &&
    pendingTierFromSubscription !== currentTier;

  function onTierButtonClick(targetTierKey: string) {
    // If a pending change is queued and the user clicks a DIFFERENT non-current,
    // non-pending tier, surface a confirmation so they don't silently overwrite
    // their own scheduled change. The on-card button for the pending tier itself
    // is already disabled; the primary cancel path is the banner.
    if (
      hasPendingChange &&
      targetTierKey !== pendingTierFromSubscription &&
      targetTierKey !== currentTier
    ) {
      setConfirmReplacePendingTo(targetTierKey);
      return;
    }
    handleTierChange(targetTierKey, currentTier, setConfirmDowngradeTo);
  }

  // Gate the "Pick a plan" banner on the DB tier rather than
  // has_active_stripe_subscription so a transient Stripe outage doesn't show
  // the banner to active subscribers. Same rationale as PaywallGate.
  const needsSubscription = isPaymentEnabled && subscription.tier === "NO_TIER";

  return (
    <div className="space-y-4">
      <Text variant="lead-medium" as="h3" tone="inherit">
        {t("Subscription Plan", "订阅套餐")}
      </Text>

      {needsSubscription && (
        <div
          role="status"
          className="rounded-md border border-brand/40 bg-accent-surface px-4 py-3 text-accent-strong"
        >
          <Text variant="body-medium-tight" as="p" tone="inherit">
            {t(
              "Pick a plan to continue using AutoGPT.",
              "选择套餐以继续使用 AutoGPT。",
            )}
          </Text>
          <Text variant="body-tight" as="p" tone="inherit" className="mt-1">
            {t(
              "Your account doesn't have an active subscription. Choose a tier below to start working with experts and running workflows.",
              "你的账户没有有效订阅。请选择下方套餐，开始与专家协作并运行工作流。",
            )}
          </Text>
        </div>
      )}

      {tierError && (
        <div
          role="alert"
          className="rounded-md border border-error/20 bg-error-surface px-3 py-2 text-error-foreground"
        >
          <Text variant="body-tight" as="p" tone="inherit">
            {tierError}
          </Text>
        </div>
      )}

      {hasPendingChange && pendingTierFromSubscription ? (
        <PendingChangeBanner
          currentTier={currentTier}
          pendingTier={pendingTierFromSubscription}
          pendingEffectiveAt={subscription.pending_tier_effective_at}
          onKeepCurrent={() => void cancelPendingChange()}
          isBusy={isPending}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIERS.filter(
          (tier) => subscription.tier_costs[tier.key] !== undefined,
        ).map((tier) => {
          const isCurrent = currentTier === tier.key;
          const cost = subscription.tier_costs[tier.key] ?? 0;
          const currentIdx = TIER_ORDER.indexOf(currentTier);
          const targetIdx = TIER_ORDER.indexOf(tier.key);
          const isUpgrade = targetIdx > currentIdx;
          const isDowngrade = targetIdx < currentIdx;
          const isThisPending = pendingTier === tier.key;
          const isScheduledTier =
            hasPendingChange && pendingTierFromSubscription === tier.key;
          const tierLabel = getTierLabel(tier.key, locale);
          const rateLimitLabel = formatRelativeMultiplier(
            tier.key,
            subscription.tier_multipliers ?? {},
            locale,
          );

          return (
            <div
              key={tier.key}
              aria-current={isCurrent ? "true" : undefined}
              className={`rounded-lg border p-4 ${
                isCurrent
                  ? "border-brand bg-accent-surface"
                  : "border-border-base"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <Text variant="large-semibold-tight" as="span" tone="inherit">
                  {tierLabel}
                </Text>
                {isCurrent && (
                  <span className="flex rounded-full bg-brand/10 px-2 py-0.5 text-accent-strong">
                    <Text variant="small-medium-tight" as="span" tone="inherit">
                      {t("Current", "当前套餐")}
                    </Text>
                  </span>
                )}
              </div>

              <Text
                variant="heading-md-bold"
                as="p"
                tone="inherit"
                className="mb-1"
              >
                {formatCost(cost, tier.key, locale)}
              </Text>
              {rateLimitLabel && (
                <Text
                  variant="body-medium-tight"
                  as="p"
                  tone="secondary"
                  className="mb-1"
                >
                  {rateLimitLabel}
                </Text>
              )}
              <Text variant="body-tight" as="p" tone="muted" className="mb-4">
                {t(
                  tier.description,
                  tierDescriptions[tier.key] ?? tier.description,
                )}
              </Text>

              {!isCurrent && isPaymentEnabled && (
                <Button
                  className="w-full"
                  variant={isUpgrade ? "compact-primary" : "compact-outline"}
                  size="compact"
                  disabled={isPending || isScheduledTier}
                  onClick={() => onTierButtonClick(tier.key)}
                >
                  {isThisPending
                    ? t("Updating...", "正在更新…")
                    : isScheduledTier
                      ? t("Scheduled", "已安排")
                      : isUpgrade
                        ? t(`Upgrade to ${tierLabel}`, `升级至 ${tierLabel}`)
                        : isDowngrade
                          ? t(
                              `Downgrade to ${tierLabel}`,
                              `降级至 ${tierLabel}`,
                            )
                          : t(`Switch to ${tierLabel}`, `切换至 ${tierLabel}`)}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {currentTier !== "NO_TIER" && isPaymentEnabled && (
        <div className="flex items-center justify-between gap-3">
          <Text variant="body-tight" as="p" tone="muted">
            {t(
              "Your subscription is managed through Stripe. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.",
              "你的订阅通过 Stripe 管理。升级立即生效，降级在当前账单周期结束时生效。",
            )}
          </Text>
          {!hasPendingChange && (
            <Button
              variant="compact-ghost"
              size="compact"
              // oxlint-disable-next-line design-system/no-restyle -- no quiet destructive Button variant (grey text, red on hover) yet
              className="shrink-0 text-foreground-secondary hover:text-error-foreground"
              disabled={isPending}
              onClick={() => setConfirmDowngradeTo("NO_TIER")}
            >
              {t("Cancel subscription", "取消订阅")}
            </Button>
          )}
        </div>
      )}

      <Dialog
        title={t("Confirm Downgrade", "确认降级")}
        controlled={{
          isOpen: !!confirmDowngradeTo,
          set: (open) => {
            if (!open) setConfirmDowngradeTo(null);
          },
        }}
      >
        <Dialog.Content>
          <Text variant="body-tight" as="p" tone="secondary">
            {confirmDowngradeTo === "NO_TIER"
              ? t(
                  `Cancelling your subscription schedules it to end at the close of your current billing period${periodEnd ? ` on ${periodEnd}` : ""} — no charge today and no further charges to your card. You keep your current plan and existing credits until then.`,
                  `取消订阅将在当前账单周期结束时${periodEnd ? `（${periodEnd}）` : ""}生效——今天不扣款，之后也不会再从银行卡扣款。在此之前，你仍可使用当前套餐和已有积分。`,
                )
              : t(
                  `Switching to ${getTierLabel(confirmDowngradeTo ?? "", locale)} takes effect at the end of your current billing period${periodEnd ? ` on ${periodEnd}` : ""} — no charge today. You keep your current plan until then. From that date your saved card is billed at the ${getTierLabel(confirmDowngradeTo ?? "", locale)} rate.`,
                  `切换至 ${getTierLabel(confirmDowngradeTo ?? "", locale)} 将在当前账单周期结束时${periodEnd ? `（${periodEnd}）` : ""}生效——今天不扣款。在此之前，你仍可使用当前套餐。此后将按 ${getTierLabel(confirmDowngradeTo ?? "", locale)} 的费率向已保存的银行卡扣款。`,
                )}{" "}
            {t("Are you sure?", "确定继续吗？")}
          </Text>
          <Dialog.Footer>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setConfirmDowngradeTo(null)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="compact-destructive"
              size="compact"
              onClick={() => void confirmDowngrade()}
            >
              {t("Confirm Downgrade", "确认降级")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog
        title={t("Replace pending change?", "替换待生效的更改？")}
        controlled={{
          isOpen: !!confirmReplacePendingTo,
          set: (open) => {
            if (!open) setConfirmReplacePendingTo(null);
          },
        }}
      >
        <Dialog.Content>
          <Text variant="body-tight" as="p" tone="secondary">
            {t(
              "You have a pending change to",
              "你有一项待生效的更改，目标套餐为",
            )}{" "}
            {getTierLabel(pendingTierFromSubscription ?? "", locale)}
            {subscription.pending_tier_effective_at
              ? t(
                  ` scheduled for ${formatPendingDate(subscription.pending_tier_effective_at, locale)}`,
                  `，计划于 ${formatPendingDate(subscription.pending_tier_effective_at, locale)} 生效`,
                )
              : ""}
            {t(
              `. Switching to ${getTierLabel(confirmReplacePendingTo ?? "", locale)} will replace it. Continue?`,
              `。切换至 ${getTierLabel(confirmReplacePendingTo ?? "", locale)} 将替换该更改。继续吗？`,
            )}
          </Text>
          <Dialog.Footer>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setConfirmReplacePendingTo(null)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="compact-destructive"
              size="compact"
              onClick={() => void confirmReplacePending()}
            >
              {t("Replace pending change", "替换待生效的更改")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog
        title={t("Confirm Upgrade", "确认升级")}
        controlled={{
          isOpen: !!pendingUpgradeTier,
          set: (open) => {
            if (!open) setPendingUpgradeTier(null);
          },
        }}
      >
        <Dialog.Content>
          <Text variant="body-tight" as="p" tone="secondary">
            {subscription.has_active_stripe_subscription
              ? t(
                  `Your subscription is upgraded to ${getTierLabel(pendingUpgradeTier ?? "", locale)} immediately. On your next invoice${periodEnd ? ` on ${periodEnd}` : ""}, your saved card is charged for the upgrade proration since today plus the next month at the new rate, with the unused portion of your current plan automatically deducted.`,
                  `你的订阅将立即升级至 ${getTierLabel(pendingUpgradeTier ?? "", locale)}。下次出账${periodEnd ? `（${periodEnd}）` : ""}时，将向已保存的银行卡收取从今天起按比例计算的升级费用，以及按新费率计算的下月费用，并自动抵扣当前套餐未使用的部分。`,
                )
              : t(
                  `You'll be redirected to Stripe to enter payment details and start your ${getTierLabel(pendingUpgradeTier ?? "", locale)} subscription.`,
                  `即将跳转至 Stripe，填写支付信息并开始 ${getTierLabel(pendingUpgradeTier ?? "", locale)} 订阅。`,
                )}
          </Text>
          <Dialog.Footer>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setPendingUpgradeTier(null)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="compact-primary"
              size="compact"
              onClick={() => void confirmUpgrade()}
            >
              {subscription.has_active_stripe_subscription
                ? t("Confirm Upgrade", "确认升级")
                : t("Continue to Checkout", "继续结账")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
