"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getGetV2GetCopilotUsageQueryKey } from "@/app/api/__generated__/endpoints/chat/chat";

import {
  useGetSubscriptionStatus,
  useGetV1ManagePaymentMethods,
  useUpdateSubscriptionTier,
} from "@/app/api/__generated__/endpoints/credits/credits";
import type { GetV1ManagePaymentMethods200 } from "@/app/api/__generated__/models/getV1ManagePaymentMethods200";
import type { SubscriptionStatusResponse } from "@/app/api/__generated__/models/subscriptionStatusResponse";
import type { SubscriptionTierRequestBillingCycle } from "@/app/api/__generated__/models/subscriptionTierRequestBillingCycle";
import type { SubscriptionTierRequestTier } from "@/app/api/__generated__/models/subscriptionTierRequestTier";
import type { SubscriptionUpgradePreview } from "@/app/api/__generated__/models/subscriptionUpgradePreview";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useCheckoutRedirect } from "@/hooks/useCheckoutRedirect";
import {
  centsToUSD,
  getSubscriptionValue,
  trackAdsConversionBeforeNavigation,
} from "@/services/analytics/google-ads";
import {
  trackBillingPortalOpened,
  trackPaywallViewed,
  trackPlanSelected,
} from "@/services/analytics/monetization-analytics";
import {
  getSubscriptionPlan,
  getPlanLabel,
  PLAN_LABEL,
} from "@/services/billing/subscription-plan";

import { formatCents, formatShortDate } from "../../../helpers";
import { getCheckoutReturnURLs } from "../helpers";
import { useTierUpgradePreview } from "./useTierUpgradePreview";

// ENTERPRISE seats are provisioned by an administrator and the backend
// rejects every self-service change from them with 403, so the card must
// not offer any plan controls — point these users at the account team.
export const ENTERPRISE_CONTACT_URL = "mailto:contact@agpt.co";

// Team upgrade is contact-sales — open the Tally intake form rather than
// firing a Stripe Checkout from the BUSINESS tier.
export const TEAM_UPGRADE_URL = "https://tally.so/r/2Eb9zj";

// User-visible paid plans only. NO_TIER is the "no active subscription" state
// (gates the platform via PaywallGate); BASIC + ENTERPRISE are reserved
// internal slots and never offered as upgrade targets in the settings UI.
const TIER_ORDER = [
  "PRO",
  "MAX",
  "BUSINESS",
] as const satisfies readonly SubscriptionTierRequestTier[];

function getNextTier(current: string): SubscriptionTierRequestTier | null {
  const idx = TIER_ORDER.indexOf(current as (typeof TIER_ORDER)[number]);
  if (idx === -1) return TIER_ORDER[0];
  if (idx === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

function getPreviousTier(current: string): SubscriptionTierRequestTier | null {
  const idx = TIER_ORDER.indexOf(current as (typeof TIER_ORDER)[number]);
  if (idx <= 0) return null;
  return TIER_ORDER[idx - 1];
}

export function useYourPlanCard() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [handledUpgrade, setHandledUpgrade] = useState(false);
  const subscription = useGetSubscriptionStatus({
    query: {
      select: (res) =>
        res.status === 200
          ? (res.data as SubscriptionStatusResponse)
          : undefined,
    },
  });

  const paymentPortal = useGetV1ManagePaymentMethods({
    query: {
      select: (res) => {
        const raw = res.data as GetV1ManagePaymentMethods200 | undefined;
        const url = raw && typeof raw === "object" ? raw.url : undefined;
        return typeof url === "string" ? url : undefined;
      },
    },
  });

  const { mutateAsync: updateTier, isPending: isUpdatePending } =
    useUpdateSubscriptionTier();
  // The mutation settles before the Checkout redirect starts; this keeps the
  // plan actions busy across the wait for the Ads conversion too.
  const [isChangingTier, setIsChangingTier] = useState(false);
  const checkoutRedirect = useCheckoutRedirect();
  const isUpdatingTier =
    isUpdatePending || isChangingTier || checkoutRedirect.isRedirectingHere;

  const {
    tier: effectiveTier,
    billingCycle: serverCycle,
    isAdminManaged,
    pendingTier,
    pendingEffectiveAt,
    pendingBillingCycle,
    isPendingCancel,
    isPendingDowngrade,
    isPendingCycleSwitch,
  } = getSubscriptionPlan(subscription.data);
  const isPaid = effectiveTier !== null && effectiveTier !== "NO_TIER";

  const [selectedCycle, setSelectedCycle] =
    useState<SubscriptionTierRequestBillingCycle>(serverCycle);
  const [pendingCycle, setPendingCycle] =
    useState<SubscriptionTierRequestBillingCycle | null>(null);
  // Tier upgrades on a paid plan run through always_invoice immediate billing
  // — without a confirmation step the user is silently charged a large
  // prorated amount on a single click. Stage the target tier here and only
  // fire the mutation after the SwitchTierDialog confirms.
  const [pendingTierUpgrade, setPendingTierUpgrade] =
    useState<SubscriptionTierRequestTier | null>(null);
  // Downgrade is end-of-period (no charge today) so the risk is lower than
  // upgrade, but we still gate behind a confirm dialog so the user gets
  // explicit feedback that the action took effect.
  const [pendingTierDowngrade, setPendingTierDowngrade] =
    useState<SubscriptionTierRequestTier | null>(null);
  const upgradeReview = useTierUpgradePreview(
    pendingTierUpgrade === "MAX" &&
      effectiveTier === "PRO" &&
      subscription.data?.has_active_stripe_subscription === true,
    serverCycle,
  );

  // Re-sync local toggle when the server response updates (e.g. after refetch
  // post-mutation). Avoids stale "yearly" pill after a successful switch.
  useEffect(() => {
    setSelectedCycle(serverCycle);
  }, [serverCycle]);

  const hasSubscriptionData = Boolean(subscription.data);
  useEffect(() => {
    if (hasSubscriptionData) trackPaywallViewed("billing");
  }, [hasSubscriptionData]);

  // ENTERPRISE sits above every self-serve tier, so it has no upgrade target
  // and no self-serve downgrade (getNextTier would otherwise fall back to
  // PRO and offer a downgrade labelled "Upgrade").
  const nextTierKey =
    effectiveTier && !isAdminManaged ? getNextTier(effectiveTier) : null;
  const previousTierKey =
    effectiveTier && !isAdminManaged ? getPreviousTier(effectiveTier) : null;

  const tierCostsYearly = subscription.data?.tier_costs_yearly ?? {};
  const tierCosts = subscription.data?.tier_costs ?? {};
  const currentTierKey = effectiveTier ?? "NO_TIER";
  const currentYearlyCents = tierCostsYearly[currentTierKey];
  const currentMonthlyCents = tierCosts[currentTierKey];
  // Stripe credits the unused portion of the user's current monthly invoice
  // when switching to yearly with proration_behavior="always_invoice"; the
  // backend computes the same value (monthly_cost * remaining / total) and
  // exposes it on the status payload so we can show the actual charge today.
  const prorationCreditCents = subscription.data?.proration_credit_cents ?? 0;
  const currentPeriodEndMs = subscription.data?.current_period_end
    ? subscription.data.current_period_end * 1000
    : null;

  const plan = subscription.data
    ? {
        tierKey: effectiveTier ?? subscription.data.tier,
        label: getPlanLabel(effectiveTier ?? subscription.data.tier, locale),
        monthlyCostCents: subscription.data.monthly_cost,
        isPaidPlan: isPaid,
        nextTier: nextTierKey,
        nextTierLabel: nextTierKey ? getPlanLabel(nextTierKey, locale) : null,
        // Team (BUSINESS) is contact-sales, not a self-serve Checkout. The
        // upgrade button for MAX users opens the marketing/sales page rather
        // than POSTing to /credits/subscription.
        nextTierIsTeamLink: nextTierKey === "BUSINESS",
        previousTier: previousTierKey,
        previousTierLabel: previousTierKey
          ? getPlanLabel(previousTierKey, locale)
          : null,
        currentPeriodEnd: subscription.data.current_period_end ?? null,
        pendingTier,
        pendingTierLabel: pendingTier
          ? getPlanLabel(pendingTier, locale)
          : null,
        pendingEffectiveAt,
        pendingCycle: pendingBillingCycle,
        isPendingCancel,
        isPendingDowngrade,
        isPendingCycleSwitch,
        billingCycle: serverCycle,
        isAdminManaged,
      }
    : undefined;

  // ENTERPRISE seats are admin-managed; BASIC is a reserved internal slot;
  // NO_TIER means no active subscription. None of those have a
  // user-manageable cycle to switch — the toggle would be dead UI.
  const isCycleToggleVisible =
    effectiveTier !== null &&
    !isAdminManaged &&
    effectiveTier !== "BASIC" &&
    effectiveTier !== "NO_TIER";

  async function changeTier(
    tier: SubscriptionTierRequestTier,
    billingCycle?: SubscriptionTierRequestBillingCycle,
    preview?: SubscriptionUpgradePreview,
  ) {
    if (isUpdatingTier || checkoutRedirect.isRedirecting) return false;
    setIsChangingTier(true);
    try {
      return await requestTierChange(tier, billingCycle, preview);
    } finally {
      setIsChangingTier(false);
    }
  }

  async function requestTierChange(
    tier: SubscriptionTierRequestTier,
    billingCycle?: SubscriptionTierRequestBillingCycle,
    preview?: SubscriptionUpgradePreview,
  ) {
    const cycle = billingCycle ?? "monthly";
    const { successURL, cancelURL } = getCheckoutReturnURLs({ tier, cycle });
    try {
      const result = await updateTier({
        data: {
          tier,
          success_url: successURL,
          cancel_url: cancelURL,
          ...(billingCycle ? { billing_cycle: billingCycle } : {}),
          ...(preview
            ? {
                preview_id: preview.preview_id,
                proration_date: preview.proration_date,
              }
            : {}),
          surface: "billing",
        },
      });
      const url = (result?.data as { url?: string } | undefined)?.url;
      if (url) {
        // A Checkout URL is the only proof that Stripe Checkout actually
        // starts: paid users are modified in place and get no URL, which is
        // not a checkout start.
        // /credits/subscription returns what Stripe actually charges; the
        // plan-card figure is only the fallback when the tier isn't priced there.
        const cents =
          cycle === "yearly" ? tierCostsYearly[tier] : tierCosts[tier];
        await trackAdsConversionBeforeNavigation("begin_checkout", {
          value: centsToUSD(cents) ?? getSubscriptionValue(tier, cycle),
        });
        // Navigating away — don't refetch (would set state on an
        // unmounting component while Stripe Checkout takes over).
        window.location.href = url;
        checkoutRedirect.markRedirecting();
        return;
      }
      await Promise.all([
        subscription.refetch(),
        queryClient.invalidateQueries({
          queryKey: getGetV2GetCopilotUsageQueryKey(),
        }),
      ]);
      return true;
    } catch (error) {
      if (
        preview &&
        error instanceof ApiError &&
        (error.status === 409 || error.status === 402)
      ) {
        upgradeReview.invalidate(
          error.status === 402
            ? t(
                "Payment wasn’t completed. Check your payment method, then review the charge again.",
                "支付未完成。请检查支付方式，然后重新核对费用。",
              )
            : undefined,
        );
        return false;
      }
      // 422 fail-closed on a YEARLY request = LD missing the *_YEARLY price for
      // this tier. Match billingCycle === "yearly" specifically — a 422 on a
      // monthly request is a different failure (e.g. tier unconfigured) and
      // should surface the generic "Couldn't update your plan" copy below
      // instead of misleading the user about yearly availability.
      if (
        error instanceof ApiError &&
        error.status === 422 &&
        billingCycle === "yearly"
      ) {
        toast({
          title: t(
            "Yearly billing is not yet available for your plan.",
            "你的套餐暂不支持按年计费。",
          ),
          description: t("Please contact support.", "请联系支持。"),
          variant: "destructive",
        });
        return false;
      }
      toast({
        title: t("Couldn't update your plan", "无法更新你的套餐"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "Stripe didn't accept the change. Please try again.",
                "Stripe 未接受此更改，请重试。",
              ),
        variant: "destructive",
      });
      return false;
    }
  }

  async function downgradeSubscription(
    targetTier: SubscriptionTierRequestTier,
  ) {
    // End-of-period downgrade: backend's modify_stripe_subscription_for_tier
    // schedules a phase change at current_period_end. No proration today —
    // user keeps higher tier until period end, then drops to lower price.
    if (!plan?.isPaidPlan) return;
    const targetLabel = getPlanLabel(targetTier, locale);
    // Preserve the user's current cycle on downgrade — without forwarding
    // serverCycle, the backend would default the missing billing_cycle to
    // "monthly" and silently flip a yearly subscriber to monthly at period
    // end (Sentry caught this; the same-tier release path also bites).
    const ok = await changeTier(targetTier, serverCycle);
    if (!ok) return;
    const periodEnd = plan.currentPeriodEnd
      ? formatShortDate(plan.currentPeriodEnd * 1000, locale)
      : null;
    toast({
      title: t("Downgrade scheduled", "已安排降级"),
      description: periodEnd
        ? t(
            `You keep ${plan.label} until ${periodEnd}, then switch to ${targetLabel}. No charge today.`,
            `你可继续使用 ${plan.label} 至 ${periodEnd}，之后将切换至 ${targetLabel}。今天不扣款。`,
          )
        : t(
            `Your plan will switch to ${targetLabel} at the close of the current billing period. No charge today.`,
            `当前计费周期结束后，你的套餐将切换至 ${targetLabel}。今天不扣款。`,
          ),
    });
  }

  async function resumeSubscription() {
    // POSTing the current tier+cycle back to the backend releases any pending
    // schedule — cancel_at_period_end (NO_TIER pending), paid→paid downgrade,
    // and same-tier yearly→monthly cycle switch all share the release path.
    // See release_pending_subscription_schedule + the same-tier branch of
    // update_subscription_tier.
    if (
      !plan?.isPaidPlan ||
      (!plan?.isPendingCancel &&
        !plan?.isPendingDowngrade &&
        !plan?.isPendingCycleSwitch)
    ) {
      return;
    }
    // Same-tier release also gates on cycle: omitting billing_cycle defaults
    // the backend to "monthly", which on a yearly sub is treated as a
    // cycle-switch instead of a release-pending — silent flip to monthly.
    const ok = await changeTier(
      plan.tierKey as SubscriptionTierRequestTier,
      serverCycle,
    );
    if (!ok) return;
    toast({
      title: plan.isPendingCancel
        ? t("Subscription resumed", "订阅已恢复")
        : plan.isPendingCycleSwitch
          ? t("Cycle switch cancelled", "已取消周期切换")
          : t("Downgrade cancelled", "已取消降级"),
      description: t(
        `Your ${plan.label} plan will continue to renew as normal.`,
        `你的 ${plan.label} 套餐将继续正常续订。`,
      ),
    });
  }

  function onCycleChange(nextCycle: SubscriptionTierRequestBillingCycle) {
    if (nextCycle === selectedCycle) return;
    if (!plan?.isPaidPlan) {
      // NO_TIER — the upgrade flow forwards `selectedCycle` to changeTier.
      setSelectedCycle(nextCycle);
      return;
    }
    if (nextCycle === serverCycle) {
      // User toggled back to their current server cycle while a switch
      // dialog was open elsewhere — just clear the staged change.
      setSelectedCycle(nextCycle);
      setPendingCycle(null);
      return;
    }
    setPendingCycle(nextCycle);
  }

  async function confirmCycleSwitch() {
    if (!pendingCycle || !plan?.tierKey) return;
    const ok = await changeTier(
      plan.tierKey as SubscriptionTierRequestTier,
      pendingCycle,
    );
    setPendingCycle(null);
    if (!ok) return;
    setSelectedCycle(pendingCycle);
    toast({
      title:
        pendingCycle === "yearly"
          ? t("Switched to yearly billing", "已改为按年计费")
          : t(
              "Switching to monthly at period end",
              "将在周期结束时改为按月计费",
            ),
      description:
        pendingCycle === "yearly"
          ? t(
              "Stripe will charge the prorated difference today.",
              "Stripe 今天将按比例收取差额。",
            )
          : t(
              "Your plan will switch to monthly at the end of the current period.",
              "你的套餐将在当前周期结束时改为按月计费。",
            ),
    });
  }

  function cancelCycleSwitch() {
    setPendingCycle(null);
  }

  function getDialogTitle(): string {
    if (!pendingCycle) return "";
    const tierLabel =
      effectiveTier && PLAN_LABEL[effectiveTier]
        ? getPlanLabel(effectiveTier, locale)
        : null;
    // NO_TIER / unknown tiers don't have a meaningful label for the title
    // ("Switch No active subscription to yearly billing?" reads as nonsense).
    if (
      !tierLabel ||
      effectiveTier === "NO_TIER" ||
      effectiveTier === "BUSINESS"
    ) {
      return pendingCycle === "yearly"
        ? t("Switch billing to Yearly?", "改为按年计费？")
        : t("Switch billing to Monthly?", "改为按月计费？");
    }
    return pendingCycle === "yearly"
      ? t(
          `Switch ${tierLabel} to yearly billing?`,
          `将 ${tierLabel} 改为按年计费？`,
        )
      : t(
          `Switch ${tierLabel} to monthly billing?`,
          `将 ${tierLabel} 改为按月计费？`,
        );
  }

  function getDialogBody(): { label?: string; text: string }[] {
    if (!pendingCycle) return [];
    const periodEndLabel = currentPeriodEndMs
      ? formatShortDate(currentPeriodEndMs, locale)
      : null;
    if (pendingCycle === "yearly") {
      const tierLabel = effectiveTier
        ? getPlanLabel(effectiveTier, locale)
        : null;
      // `<=` (not `<`) so a misconfigured 0%-savings yearly price still gets
      // the explicit price breakdown rather than falling through to generic
      // copy — the savings line itself is suppressed when savings == 0.
      const hasPrices =
        currentMonthlyCents !== undefined &&
        currentYearlyCents !== undefined &&
        currentMonthlyCents > 0 &&
        currentYearlyCents <= currentMonthlyCents * 12;
      if (!hasPrices) {
        return [
          {
            text: t(
              "You'll be charged the prorated difference today.",
              "今天将按比例收取差额。",
            ),
          },
          {
            text:
              currentYearlyCents !== undefined
                ? t(
                    `Renews at ${formatCents(currentYearlyCents)}/year after this period.`,
                    `本周期结束后将以每年 ${formatCents(currentYearlyCents)} 续订。`,
                  )
                : t(
                    "Renews on the new yearly cadence after this period.",
                    "本周期结束后将按新的年度周期续订。",
                  ),
          },
        ];
      }
      const yearly = formatCents(currentYearlyCents!);
      const monthlyEquivalent = formatCents(
        Math.round(currentYearlyCents! / 12),
      );
      const savingsPercent = Math.round(
        ((currentMonthlyCents! * 12 - currentYearlyCents!) /
          (currentMonthlyCents! * 12)) *
          100,
      );
      // Net charge today = full yearly price minus the unused-monthly credit
      // Stripe will apply. Only surface the exact amount when the backend
      // returned a non-zero credit (admin-granted plans / no Stripe customer
      // return 0 and we fall back to the generic line).
      const netChargeCents = Math.max(
        0,
        currentYearlyCents! - prorationCreditCents,
      );
      const chargedToday =
        prorationCreditCents > 0
          ? {
              label: t("Charged today:", "今日扣款："),
              text: t(
                `${formatCents(netChargeCents)} (prorated from your monthly plan).`,
                `${formatCents(netChargeCents)}（已按比例扣除月度套餐的剩余价值）。`,
              ),
            }
          : {
              text: t(
                "You'll be charged the prorated difference today.",
                "今天将按比例收取差额。",
              ),
            };
      const renews = periodEndLabel
        ? {
            label: t("Renews", "续订"),
            text: t(
              `${yearly}/year on ${periodEndLabel}.`,
              `于 ${periodEndLabel} 以每年 ${yearly} 续订。`,
            ),
          }
        : {
            label: t("Renews", "续订"),
            text: t(
              `at ${yearly}/year after this period.`,
              `本周期结束后以每年 ${yearly} 续订。`,
            ),
          };
      return [
        savingsPercent > 0
          ? {
              text: t(
                `Save ${savingsPercent}% with yearly billing.`,
                `按年计费可节省 ${savingsPercent}%。`,
              ),
            }
          : null,
        {
          label: tierLabel
            ? t(`${tierLabel} yearly:`, `${tierLabel} 按年：`)
            : t("Yearly:", "按年："),
          text: t(
            `${yearly}/year (${monthlyEquivalent}/month).`,
            `${yearly}/年（折合 ${monthlyEquivalent}/月）。`,
          ),
        },
        chargedToday,
        renews,
      ].filter(
        (line): line is { label?: string; text: string } => line !== null,
      );
    }
    const monthly =
      currentMonthlyCents !== undefined ? formatCents(currentMonthlyCents) : "";
    return [
      {
        text: periodEndLabel
          ? t(
              `Switches to monthly billing on ${periodEndLabel}.`,
              `于 ${periodEndLabel} 改为按月计费。`,
            )
          : t(
              "Switches to monthly at the end of your current yearly period.",
              "当前年度周期结束后改为按月计费。",
            ),
      },
      monthly
        ? {
            label: t("New price:", "新价格："),
            text: t(`${monthly}/month.`, `${monthly}/月。`),
          }
        : null,
      { text: t("No charge today.", "今天不扣款。") },
    ].filter((line): line is { label?: string; text: string } => line !== null);
  }

  useEffect(() => {
    if (handledUpgrade || !subscription.data) return;
    if (
      searchParams.get("upgrade") === "MAX" &&
      effectiveTier === "PRO" &&
      !pendingTier
    ) {
      setPendingTierUpgrade("MAX");
      setHandledUpgrade(true);
    }
  }, [
    searchParams,
    handledUpgrade,
    subscription.data,
    effectiveTier,
    pendingTier,
  ]);

  function getTierUpgradeDialogBody(): string {
    if (!pendingTierUpgrade) return "";
    const targetCents =
      serverCycle === "yearly"
        ? tierCostsYearly[pendingTierUpgrade]
        : tierCosts[pendingTierUpgrade];
    const newPrice =
      typeof targetCents === "number" ? formatCents(targetCents) : "";
    const cycleNoun = serverCycle === "yearly" ? "yearly" : "monthly";
    const cycleUnit = serverCycle === "yearly" ? "year" : "month";
    const renewLine = newPrice
      ? t(
          `After this period, your plan renews at ${newPrice} per ${cycleUnit}.`,
          `本周期结束后，你的套餐将以每${serverCycle === "yearly" ? "年" : "月"} ${newPrice} 续订。`,
        )
      : "";
    return [
      t(
        `You'll be charged the prorated difference immediately for the rest of your ${cycleNoun} period.`,
        `当前${serverCycle === "yearly" ? "年度" : "月度"}周期剩余时间的费用差额将按比例立即收取。`,
      ),
      renewLine,
      t(
        "Your current usage carries over into the higher allowance.",
        "当前已使用的用量将计入更高的额度。",
      ),
    ]
      .filter(Boolean)
      .join(" ");
  }

  async function confirmTierUpgrade() {
    if (!pendingTierUpgrade) return;
    if (upgradeReview.required && !upgradeReview.preview) return;
    const target = pendingTierUpgrade;
    const ok = await changeTier(target, serverCycle, upgradeReview.preview);
    if (ok) setPendingTierUpgrade(null);
  }

  function cancelTierUpgrade() {
    setPendingTierUpgrade(null);
  }

  function getTierDowngradeDialogBody(): string {
    if (!pendingTierDowngrade || !plan) return "";
    const targetLabel = getPlanLabel(pendingTierDowngrade, locale);
    const cycleNoun = serverCycle === "yearly" ? "yearly" : "monthly";
    const periodEnd = plan.currentPeriodEnd
      ? formatShortDate(plan.currentPeriodEnd * 1000, locale)
      : null;
    if (periodEnd) {
      return t(
        `You'll keep ${plan.label} (${cycleNoun}) until ${periodEnd}, then switch to ${targetLabel}. No charge today.`,
        `你可继续使用 ${plan.label}（${serverCycle === "yearly" ? "按年" : "按月"}）至 ${periodEnd}，之后将切换至 ${targetLabel}。今天不扣款。`,
      );
    }
    return t(
      `Your plan will switch to ${targetLabel} at the close of the current billing period. No charge today.`,
      `当前计费周期结束后，你的套餐将切换至 ${targetLabel}。今天不扣款。`,
    );
  }

  async function confirmTierDowngrade() {
    // Capture pendingTierDowngrade locally before the state-clear — passing
    // the captured value to downgradeSubscription guarantees the request
    // targets exactly the tier the user confirmed in the dialog, even if
    // plan.previousTier shifts between dialog open and confirm (e.g. an
    // unrelated subscription refetch lands).
    const target = pendingTierDowngrade;
    if (!target) return;
    setPendingTierDowngrade(null);
    await downgradeSubscription(target);
  }

  function cancelTierDowngrade() {
    setPendingTierDowngrade(null);
  }

  return {
    plan,
    isLoading: subscription.isLoading,
    isError: subscription.isError,
    retry: () => void subscription.refetch(),
    offerPriceCents: nextTierKey
      ? serverCycle === "yearly"
        ? tierCostsYearly[nextTierKey]
        : tierCosts[nextTierKey]
      : undefined,
    isUpdatingTier,
    // Any checkout on the page leaving for Stripe, not just this one.
    isRedirecting: checkoutRedirect.isRedirecting,
    upgradeReview,
    upgradeUsageMultiplier:
      subscription.data?.tier_multipliers?.MAX &&
      subscription.data.tier_multipliers.PRO
        ? Math.round(
            (subscription.data.tier_multipliers.MAX /
              subscription.data.tier_multipliers.PRO) *
              10,
          ) / 10
        : undefined,
    // ENTERPRISE has no Stripe subscription to manage; the Payment method
    // card still exposes the portal for cards and invoices.
    canManagePortal: Boolean(paymentPortal.data) && !isAdminManaged,
    // Don't offer upgrade alongside Resume — pending cancel/downgrade should
    // be released first via resumeSubscription, not stacked with a new tier.
    canUpgrade: Boolean(
      plan?.nextTier &&
        !plan?.isPendingCancel &&
        !plan?.isPendingDowngrade &&
        !plan?.isPendingCycleSwitch,
    ),
    // Downgrade only when an active paid sub has a tier below it AND no
    // pending change is already in flight — avoids stacking schedules.
    canDowngrade: Boolean(
      plan?.isPaidPlan &&
        plan?.previousTier &&
        !plan?.isPendingCancel &&
        !plan?.isPendingDowngrade &&
        !plan?.isPendingCycleSwitch,
    ),
    canResume: Boolean(
      plan?.isPendingCancel ||
        plan?.isPendingDowngrade ||
        plan?.isPendingCycleSwitch,
    ),
    selectedCycle,
    pendingCycle,
    pendingTierUpgrade,
    pendingTierUpgradeLabel: pendingTierUpgrade
      ? getPlanLabel(pendingTierUpgrade, locale)
      : null,
    pendingTierDowngrade,
    pendingTierDowngradeLabel: pendingTierDowngrade
      ? getPlanLabel(pendingTierDowngrade, locale)
      : null,
    isCycleToggleVisible,
    cycleDialogTitle: getDialogTitle(),
    cycleDialogBody: getDialogBody(),
    tierUpgradeDialogBody: getTierUpgradeDialogBody(),
    tierDowngradeDialogBody: getTierDowngradeDialogBody(),
    onCycleChange,
    onConfirmCycleSwitch: () => {
      void confirmCycleSwitch();
    },
    onCancelCycleSwitch: cancelCycleSwitch,
    onConfirmTierUpgrade: () => {
      void confirmTierUpgrade();
    },
    onCancelTierUpgrade: cancelTierUpgrade,
    onConfirmTierDowngrade: () => {
      void confirmTierDowngrade();
    },
    onCancelTierDowngrade: cancelTierDowngrade,
    onUpgrade: () => {
      if (!plan?.nextTier) return;
      trackPlanSelected({
        subscription_tier: plan.nextTier,
        billing_cycle: plan.isPaidPlan ? serverCycle : selectedCycle,
        surface: "billing",
      });
      // Team (BUSINESS) tier is contact-sales — divert to marketing page
      // instead of POSTing a Checkout the user can't self-serve.
      if (plan.nextTierIsTeamLink) {
        window.open(TEAM_UPGRADE_URL, "_blank", "noopener,noreferrer");
        return;
      }
      // Free tier (NO_TIER) flow runs through Stripe Checkout via the
      // success_url redirect — there's no immediate proration risk, so go
      // straight to changeTier without a confirm step. Only paid→paid
      // upgrades hit the always_invoice immediate-billing path.
      if (
        !plan.isPaidPlan &&
        !subscription.data?.has_active_stripe_subscription
      ) {
        void changeTier(plan.nextTier, selectedCycle);
        return;
      }
      setPendingTierUpgrade(plan.nextTier);
    },
    onDowngrade: () => {
      if (!plan?.previousTier) return;
      trackPlanSelected({
        subscription_tier: plan.previousTier,
        billing_cycle: serverCycle,
        surface: "billing",
      });
      setPendingTierDowngrade(plan.previousTier);
    },
    onResume: () => {
      void resumeSubscription();
    },
    onManage: () => {
      if (!paymentPortal.data) return;
      trackBillingPortalOpened("billing");
      window.location.href = paymentPortal.data;
    },
  };
}
