"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import type { PlanDef } from "@/components/molecules/PlanCard/plans";
import { formatTrialPrice } from "@/components/organisms/TrialCard/helpers";
import {
  getPlanPresentation,
  isTeamPlan,
  type SubscriptionPlansProps,
} from "../helpers";

interface Props extends SubscriptionPlansProps {
  plan: PlanDef;
  onTrialDetails: () => void;
}

export function OfferActions(props: Props) {
  const { t, locale } = useTranslation();
  const { trial, offer, action } = getPlanPresentation(
    props.plan,
    props,
    locale,
  );
  return (
    <div data-slot="offer-actions" className="mt-auto space-y-2">
      {trial ? (
        <Button
          type="button"
          variant="primary"
          size="small"
          className="w-full"
          loading={props.isStartingTrial}
          disabled={props.isStartingTrial || props.isUpdatingTier}
          onClick={props.onStartTrial}
        >
          {t(action, `开始 ${trial.duration_days} 天试用`)}
        </Button>
      ) : (
        <PaidPlanAction {...props} />
      )}
      <div data-slot="offer-actions-details" className="min-h-10 text-center">
        {trial ? (
          <TrialActionDetails {...props} />
        ) : offer ? (
          <AlternativeTrial {...props} offer={offer} />
        ) : (
          <Text variant="small" tone="muted">
            {isTeamPlan(props.plan.key)
              ? t(
                  "Find the right fit for your team.",
                  "为你的团队找到合适的方案。",
                )
              : t(
                  "Manage your plan and billing anytime.",
                  "随时管理套餐与账单。",
                )}
          </Text>
        )}
      </div>
      {offer && props.trialError && (
        <p
          role="alert"
          data-slot="offer-actions-error"
          className="text-body text-error"
        >
          {props.trialError}
        </p>
      )}
    </div>
  );
}

function PaidPlanAction({
  plan,
  isUpdatingTier,
  isStartingTrial,
  selectedPlan,
  onSelectPlan,
  inline = false,
  price,
}: Props & { inline?: boolean; price?: string | null }) {
  const { t } = useTranslation();
  function handleSelect() {
    onSelectPlan(plan.key);
  }

  return (
    <Button
      type="button"
      variant={inline ? "link" : plan.highlighted ? "primary" : "secondary"}
      size={inline ? "inline-xs" : "small"}
      tone={inline ? "muted" : undefined}
      className={inline ? undefined : "w-full"}
      loading={isUpdatingTier && selectedPlan === plan.key}
      disabled={isUpdatingTier || isStartingTrial}
      onClick={handleSelect}
    >
      {t(plan.cta, isTeamPlan(plan.key) ? "联系销售" : `选择 ${plan.name}`)}
      {price && ` · ${price}`}
    </Button>
  );
}

function TrialActionDetails(props: Props) {
  const { t, locale } = useTranslation();
  const { paidActionPrice } = getPlanPresentation(props.plan, props, locale);
  return (
    <Text variant="small" tone="muted">
      {t(
        "Card required. No subscription charge today.",
        "需要提供银行卡，今天不收取订阅费用。",
      )}{" "}
      <Button
        type="button"
        variant="link"
        size="inline-xs"
        tone="muted"
        onClick={props.onTrialDetails}
      >
        {t("Trial details", "试用详情")}
      </Button>
      {" · "}
      <PaidPlanAction {...props} inline price={paidActionPrice} />
    </Text>
  );
}

function AlternativeTrial({
  plan,
  offer,
  onBillingChange,
  isStartingTrial,
}: Props & {
  offer: NonNullable<SubscriptionPlansProps["trialOffer"]>;
}) {
  const { t, locale } = useTranslation();
  function handleSwitchCycle() {
    onBillingChange(offer.billing_cycle);
  }

  return (
    <div data-slot="alternative-trial">
      <Button
        type="button"
        variant="link"
        size="inline-xs"
        tone="brand"
        disabled={isStartingTrial}
        onClick={handleSwitchCycle}
      >
        {t(
          `Try ${plan.name} for ${offer.duration_days} days instead`,
          `改为试用 ${plan.name} ${offer.duration_days} 天`,
        )}
      </Button>
      <Text variant="small" tone="muted">
        {t(
          `Renews at ${formatTrialPrice(offer)} + applicable tax.`,
          `续订价格为 ${formatTrialPrice(offer, locale)}，另加适用税费。`,
        )}
      </Text>
    </div>
  );
}
