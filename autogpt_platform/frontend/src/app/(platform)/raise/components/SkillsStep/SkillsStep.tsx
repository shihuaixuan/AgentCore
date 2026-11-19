"use client";

import type { RaiseAttachmentDraft } from "../../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AttachmentStep } from "../KitStep/AttachmentStep";

interface Props {
  name: string;
  color: string | null;
  submitted: RaiseAttachmentDraft[] | null;
  existingCount: number;
  isSubmitting: boolean;
  onSubmit: (attachments: RaiseAttachmentDraft[]) => void;
  onSkip: () => void;
}

export function SkillsStep({
  name,
  color,
  submitted,
  existingCount,
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
      scope="skills"
      existingCount={existingCount}
      searchLabel={t("Search skills", "搜索技能")}
      searchPlaceholder={t(
        "Search library and marketplace skills…",
        "搜索库和市场中的技能…",
      )}
      emptyQueryHint={t(
        "Search to add a marketplace skill, or pick from your library skills.",
        "搜索并添加市场技能，或从库中选择技能。",
      )}
      emptyResultsHint={t("No matching skills.", "没有匹配的技能。")}
      primaryLabel={t(
        `Bring ${name || "them"} to life`,
        `创建${name ? ` ${name}` : "专家"}`,
      )}
      onSubmit={onSubmit}
      onSkip={onSkip}
    />
  );
}
