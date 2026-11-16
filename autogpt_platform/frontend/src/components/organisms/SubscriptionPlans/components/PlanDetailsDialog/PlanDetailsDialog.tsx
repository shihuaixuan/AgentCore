"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialOfferResponse } from "@/app/api/__generated__/models/trialOfferResponse";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import type { PlanDef } from "@/components/molecules/PlanCard/plans";
import type { PlanDialog } from "../../helpers";
import { PlanComparison } from "./components/PlanComparison";
import { TrialDetails } from "./components/TrialDetails";

interface Props {
  kind: PlanDialog;
  setOpen: (open: boolean) => void;
  trialOffer: TrialOfferResponse | null;
  plans: PlanDef[];
}

export function PlanDetailsDialog({ kind, setOpen, trialOffer, plans }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={
        kind === "compare"
          ? t("Compare plans", "比较套餐")
          : t("Your trial. No surprises.", "试用条款，清晰透明。")
      }
      variant="compact"
      controlled={{ isOpen: kind !== null, set: setOpen }}
      className="max-w-2xl"
    >
      <Dialog.Content>
        {kind === "compare" ? (
          <PlanComparison plans={plans} />
        ) : (
          trialOffer && <TrialDetails offer={trialOffer} />
        )}
      </Dialog.Content>
    </Dialog>
  );
}
