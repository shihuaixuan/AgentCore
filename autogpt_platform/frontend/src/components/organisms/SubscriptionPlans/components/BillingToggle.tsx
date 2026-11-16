"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import type { SubscriptionPlansProps } from "../helpers";

type Props = Pick<SubscriptionPlansProps, "billing" | "onBillingChange">;

export function BillingToggle({ billing, onBillingChange }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("Billing period", "计费周期")}
      data-slot="billing-toggle"
      className="mt-3 flex rounded-full border border-border-base bg-surface-hover p-1"
    >
      {(["monthly", "yearly"] as const).map((cycle) => (
        <Button
          key={cycle}
          type="button"
          variant="ghost"
          size="xs"
          shape="pill"
          aria-pressed={billing === cycle}
          onClick={() => onBillingChange(cycle)}
          className={cn(
            "px-4",
            billing === cycle
              ? "bg-surface text-foreground-strong shadow-sm hover:bg-surface"
              : "text-foreground-tertiary",
          )}
        >
          {cycle === "monthly"
            ? t("Monthly billing", "按月计费")
            : t("Yearly billing", "按年计费")}
          {cycle === "yearly" && (
            <span
              data-slot="billing-toggle-savings"
              className="text-caption text-success"
            >
              {t("Save 15%", "节省 15%")}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
