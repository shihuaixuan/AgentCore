"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { creditsToUsdLabel } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { SpendMeter } from "../../components/ExpertTeamCard/components/SpendMeter";
import { getWeeklySpend } from "../../helpers";
import { EditBudgetDialog } from "./EditBudgetDialog/EditBudgetDialog";

interface Props {
  expert: Expert;
  /** The cover colour it sits on: text and meter take darker shades of it. */
  color?: string;
  className?: string;
}

export function ExpertBudgetSection({ expert, color, className }: Props) {
  const { t } = useTranslation();
  const weeklySpend = getWeeklySpend(expert);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <section
      aria-label={t(`${expert.name} budget`, `${expert.name} 的预算`)}
      style={
        color
          ? {
              // oxlint-disable-next-line design-system/no-inline-styles -- tinted by the expert's own colour, which is runtime data
              color: `color-mix(in srgb, ${color} 55%, rgb(var(--color-foreground-strong)))`,
            }
          : undefined
      }
      className={cn("flex w-full shrink-0 flex-col gap-1.5", className)}
    >
      <div className="flex items-center justify-between gap-2 tabular-nums">
        <div className="flex items-center gap-1">
          <Text variant="body-medium" tone={color ? "inherit" : "secondary"}>
            {t("Budget", "预算")}
          </Text>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            leadingIcon={PencilEdit02Icon}
            aria-label={t("Edit budget", "编辑预算")}
            tone={color ? "inherit" : undefined}
            // oxlint-disable-next-line design-system/no-restyle -- the ghost Button has no variant with a tinted card's translucent hover
            className={cn(color && "hover:bg-surface/50")}
            onClick={() => setIsEditOpen(true)}
          />
        </div>
        <Text variant="body-medium" tone={color ? "inherit" : "secondary"}>
          {weeklySpend
            ? `${creditsToUsdLabel(weeklySpend.spent)} / ${creditsToUsdLabel(weeklySpend.budget)}`
            : t("No budget", "未设置预算")}
        </Text>
      </div>
      <SpendMeter
        spent={weeklySpend?.spent ?? 0}
        budget={weeklySpend?.budget ?? 1}
        muted={!weeklySpend}
        color={color}
      />
      <EditBudgetDialog
        expert={expert}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </section>
  );
}
