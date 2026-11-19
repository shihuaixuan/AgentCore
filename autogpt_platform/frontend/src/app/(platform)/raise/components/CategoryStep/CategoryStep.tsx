"use client";

import type { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { bubbleClassFor } from "../ColorStep/helpers";
import { categoryOptionsForSelection } from "./helpers";

interface Props {
  selectedCategory: ExpertAvatarRequestCategory | null;
  color: string | null;
  onPick: (category: ExpertAvatarRequestCategory) => void;
}

export function CategoryStep({ selectedCategory, color, onPick }: Props) {
  const { t } = useTranslation();
  const labels: Record<ExpertAvatarRequestCategory, string> = {
    general: "通用",
    marketing: "市场营销",
    sales: "销售",
    finance: "财务",
    support: "客户支持",
    operations: "运营",
    research: "研究",
    content: "内容创作",
    development: "开发",
  };
  const options = categoryOptionsForSelection(selectedCategory);

  return (
    <div
      role="group"
      aria-label={t("What the expert works on", "专家的工作领域")}
      className="flex flex-wrap justify-end gap-2.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onPick(option.id)}
          disabled={Boolean(selectedCategory)}
          aria-pressed={selectedCategory ? true : undefined}
          className={cn(
            "flex items-center gap-2 rounded-full border px-5 py-2.5 text-body font-medium text-foreground-base transition-colors",
            selectedCategory
              ? (bubbleClassFor(color) ?? "border-brand bg-brand/5")
              : "border-border-base bg-canvas hover:border-brand hover:bg-brand/5",
          )}
        >
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full"
            // oxlint-disable-next-line design-system/no-inline-styles -- the swatch is the category's own colour, from data
            style={{ backgroundColor: option.hex }}
          />
          {t(option.label, labels[option.id])}
        </button>
      ))}
    </div>
  );
}
