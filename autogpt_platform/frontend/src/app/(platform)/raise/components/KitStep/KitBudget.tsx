"use client";

import { Input } from "@/components/atoms/Input/Input";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { bubbleClassFor } from "../ColorStep/helpers";
import { BUDGET_PRESETS } from "./helpers";

interface Props {
  weeklyBudget: number | null;
  customAmount: string;
  color: string | null;
  onSelect: (credits: number) => void;
  onCustomChange: (value: string) => void;
}

export function KitBudget({
  weeklyBudget,
  customAmount,
  color,
  onSelect,
  onCustomChange,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full max-w-[42rem] flex-col items-end gap-3">
      <div
        role="group"
        aria-label={t("Weekly budget", "每周预算")}
        className="flex flex-wrap justify-end gap-2.5"
      >
        {BUDGET_PRESETS.map((preset) => {
          const selected = !customAmount && weeklyBudget === preset.credits;
          return (
            <button
              key={preset.credits}
              type="button"
              onClick={() => onSelect(preset.credits)}
              aria-pressed={selected}
              className={cn(
                "rounded-full border px-5 py-2.5 text-body font-medium text-foreground-base transition-colors",
                selected
                  ? (bubbleClassFor(color) ?? "border-brand bg-brand/5")
                  : "border-border-base bg-canvas hover:border-brand hover:bg-brand/5",
              )}
            >
              {t(
                preset.label,
                preset.credits === 0
                  ? "不设每周上限"
                  : `$${preset.credits / 100} / 周`,
              )}
            </button>
          );
        })}
      </div>
      <Input
        id="raise-kit-custom-budget"
        label={t("Custom weekly budget in dollars", "自定义每周预算（美元）")}
        hideLabel
        size="small"
        inputMode="decimal"
        value={customAmount}
        onChange={(event) => onCustomChange(event.target.value)}
        placeholder={t("Custom amount, e.g. $7.50…", "自定义金额，例如 $7.50…")}
        wrapperClassName="mb-0 w-full max-w-[16rem] [&_input]:h-[2.625rem] [&_input]:py-3"
      />
    </div>
  );
}
