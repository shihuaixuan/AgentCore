"use client";

import type { RaiseAttachmentDraft } from "../../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AttachmentStep } from "../KitStep/AttachmentStep";

interface Props {
  name: string;
  color: string | null;
  submitted: RaiseAttachmentDraft[] | null;
  isFinal: boolean;
  isSubmitting: boolean;
  onSubmit: (attachments: RaiseAttachmentDraft[]) => void;
  onSkip: () => void;
}

export function MarketplaceStep({
  name,
  color,
  submitted,
  isFinal,
  isSubmitting,
  onSubmit,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  return (
    <AttachmentStep
      color={color}
      submitted={submitted}
      isSubmitting={isSubmitting}
      scope="marketplace"
      searchLabel={t(
        "Search marketplace and library workflows",
        "搜索市场和库中的工作流",
      )}
      searchPlaceholder={t(
        "Search marketplace and library workflows…",
        "搜索市场和库中的工作流…",
      )}
      emptyQueryHint={t(
        "Search to add marketplace or library workflows.",
        "搜索并添加市场或库中的工作流。",
      )}
      emptyResultsHint={t("No matching workflows.", "没有匹配的工作流。")}
      primaryLabel={
        isFinal
          ? t(
              `Bring ${name || "them"} to life`,
              `创建${name ? ` ${name}` : "专家"}`,
            )
          : t("That's it", "就这样")
      }
      onSubmit={onSubmit}
      onSkip={onSkip}
    />
  );
}
