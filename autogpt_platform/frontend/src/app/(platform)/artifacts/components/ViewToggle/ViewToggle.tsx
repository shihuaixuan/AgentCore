"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { cn } from "@/lib/utils";
import { GridViewIcon, ListViewIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ArtifactsView } from "../../useArtifactsPage";

interface Props {
  value: ArtifactsView;
  onChange: (view: ArtifactsView) => void;
}

interface Option {
  value: ArtifactsView;
  label: string;
  zh: string;
  icon: IconSvgElement;
}

const OPTIONS: Option[] = [
  { value: "grid", label: "Grid view", zh: "网格视图", icon: GridViewIcon },
  { value: "list", label: "List view", zh: "列表视图", icon: ListViewIcon },
];

export function ViewToggle({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("Layout", "布局")}
      className="flex items-center gap-1"
      data-testid="artifacts-view-toggle"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={t(option.label, option.zh)}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground-subtle",
              active
                ? "bg-surface-hover text-foreground-strong"
                : "text-foreground-tertiary hover:bg-surface-hover/70 hover:text-foreground-strong",
            )}
            data-testid={`artifacts-view-${option.value}`}
          >
            <Icon icon={option.icon} size={18} />
          </button>
        );
      })}
    </div>
  );
}
