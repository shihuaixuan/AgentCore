"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { ReactNode } from "react";
import { PlanDetailsDialog } from "./components/PlanDetailsDialog/PlanDetailsDialog";
import { PlanFooter } from "./components/PlanFooter";
import { PlanHeader } from "./components/PlanHeader";
import { SubscriptionOffer } from "./components/SubscriptionOffer";
import type { SubscriptionPlansProps } from "./helpers";
import { useSubscriptionPlans } from "./useSubscriptionPlans";

export function SubscriptionPlans({
  trialStatus,
  header,
  ...props
}: SubscriptionPlansProps & {
  trialStatus?: ReactNode;
  header?: ReactNode;
}) {
  const { t } = useTranslation();
  const { dialog, setDialog, setDialogOpen } = useSubscriptionPlans();
  return (
    <div
      data-slot="subscription-plans"
      className="mx-auto w-full max-w-7xl px-5 font-sans sm:px-8"
    >
      <section
        data-slot="subscription-plans-section"
        aria-label={t("Choose your AutoGPT plan", "选择你的 AutoGPT 套餐")}
      >
        <PlanHeader {...props} header={header} />
        <div
          data-slot="subscription-plans-grid"
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {props.plans.map((plan) => (
            <SubscriptionOffer
              key={plan.key}
              {...props}
              plan={plan}
              onTrialDetails={() => setDialog("trial")}
            />
          ))}
        </div>
        {trialStatus && (
          <div
            data-slot="subscription-plans-trial-status"
            className="mx-auto mt-4 w-full max-w-3xl empty:hidden"
          >
            {trialStatus}
          </div>
        )}
        <PlanFooter onCompare={() => setDialog("compare")} />
      </section>
      <PlanDetailsDialog
        kind={dialog}
        setOpen={setDialogOpen}
        trialOffer={props.trialOffer}
        plans={props.plans}
      />
    </div>
  );
}
