"use client";

import { ditherColorsFor } from "@/app/(platform)/raise/components/ColorStep/helpers";
import { ExpertActivityDay } from "@/app/api/__generated__/models/expertActivityDay";
import { cn } from "@/lib/utils";
import { getActivityCells, getActivitySummary } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const LEVEL_OPACITY = [
  "opacity-0",
  "opacity-20",
  "opacity-35",
  "opacity-50",
  "opacity-70",
] as const;

interface Props {
  days: ExpertActivityDay[];
  color?: string | null;
}

export function ExpertActivityGraph({ days, color }: Props) {
  const { t, locale } = useTranslation();
  const cells = getActivityCells(days, locale);
  const { rangeLabel } = getActivitySummary(days, locale);
  // The dither ramp's first stop is the -400 shade, dark enough to read at
  // 25% opacity for the lightest level.
  const fillColor = ditherColorsFor(color ?? null)?.[0];

  return (
    <div className="w-full pb-1">
      <div
        role="img"
        aria-label={t(`Activity over the ${rangeLabel}`, `${rangeLabel}的活动`)}
        className="grid w-full auto-cols-fr grid-flow-col grid-rows-7 gap-0.5"
        data-testid="expert-activity-graph"
      >
        {cells.map((cell) =>
          cell.label === null ? (
            <span key={cell.key} aria-hidden className="aspect-square w-full" />
          ) : (
            <span
              key={cell.key}
              title={cell.label}
              data-level={cell.level}
              style={
                cell.level > 0 && fillColor
                  ? // oxlint-disable-next-line design-system/no-inline-styles -- the expert's own colour is runtime data
                    { backgroundColor: fillColor }
                  : undefined
              }
              className={cn(
                "aspect-square w-full rounded-sm",
                cell.level === 0
                  ? "bg-surface-hover"
                  : fillColor
                    ? LEVEL_OPACITY[cell.level]
                    : "bg-action",
              )}
            />
          ),
        )}
      </div>
    </div>
  );
}
