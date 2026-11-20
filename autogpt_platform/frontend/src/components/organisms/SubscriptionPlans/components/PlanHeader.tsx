"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ReactNode } from "react";
import { AutoGPTLogo } from "@/components/atoms/AutoGPTLogo/AutoGPTLogo";
import { Text } from "@/components/atoms/Text/Text";
import type { SubscriptionPlansProps } from "../helpers";
import { BillingToggle } from "./BillingToggle";

type Props = Pick<SubscriptionPlansProps, "billing" | "onBillingChange"> & {
  // A surface with its own title (the platform paywall modal) passes its
  // heading here, or `null` to keep the heading it already renders outside the
  // organism. Left undefined, the default onboarding heading renders.
  header?: ReactNode;
};

export function PlanHeader({ header, ...billing }: Props) {
  return (
    <header
      data-slot="plan-header"
      className="mb-5 flex flex-col items-center text-center"
    >
      {header === undefined ? <DefaultHeading /> : header}
      <BillingToggle {...billing} />
    </header>
  );
}

function DefaultHeading() {
  const { t } = useTranslation();
  return (
    <>
      <AutoGPTLogo className="mb-2 size-10" />
      <Text variant="h3" as="h1" className="leading-9">
        {t("Choose the plan that's right for you", "选择适合你的套餐")}
      </Text>
      <Text variant="body" tone="muted" className="mt-1">
        {t(
          "Upgrade, downgrade, or change plans anytime. All plans include core features to get you started.",
          "随时升级、降级或更换套餐。所有套餐均包含入门所需的核心功能。",
        )}
      </Text>
    </>
  );
}
