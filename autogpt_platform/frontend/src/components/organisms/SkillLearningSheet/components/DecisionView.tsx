"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { DecisionRequestAction } from "@/app/api/__generated__/models/decisionRequestAction";
import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import {
  stepChanges,
  stripFrontmatter,
} from "@/services/skill-learning/helpers";
import { PackageFiles } from "./PackageFiles/PackageFiles";

interface Props {
  proposal: SkillVersionSummary;
  current: SkillVersionSummary | null;
  draft: string;
  hasPreviousDraft: boolean;
  onRecoverDraft: () => void;
  isBusy: boolean;
  onDraftChange: (value: string) => void;
  onDecide: (versionId: string, action: DecisionRequestAction) => void;
}

export function DecisionView({
  proposal,
  current,
  draft,
  hasPreviousDraft,
  onRecoverDraft,
  isBusy,
  onDraftChange,
  onDecide,
}: Props) {
  const { locale, t } = useTranslation();
  const changes = stepChanges(current?.body ?? "", proposal.body ?? "", locale);
  return (
    <section
      aria-label={t("Needs your decision", "需要你决定")}
      data-slot="skill-learning-sheet-decision"
      className="flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-surface/60 p-3"
    >
      <Text variant="small-medium" tone="primary">
        {t("Needs your decision", "需要你决定")}
      </Text>
      <Text variant="small" tone="secondary">
        {proposal.summary || proposal.description} — {proposal.state_reason}
      </Text>
      <ul
        data-slot="skill-learning-sheet-decision-list"
        className="flex flex-col gap-2"
        aria-label={t("Proposed changes by step", "按步骤查看提议的变更")}
      >
        {changes.map((change) => (
          <li
            key={change.step}
            data-slot="skill-learning-sheet-decision-item"
            className="rounded-md bg-surface p-2"
          >
            <Text variant="small-medium" tone="primary">
              {change.step}
            </Text>
            {change.before ? (
              <Text variant="small" tone="muted" decoration="line-through">
                {change.before}
              </Text>
            ) : null}
            <Text variant="small" tone="primary">
              {change.after ?? t("Removed", "已移除")}
            </Text>
          </li>
        ))}
      </ul>
      <PackageFiles before={current?.files} after={proposal.files} />
      {hasPreviousDraft && !draft ? (
        <div
          data-slot="skill-learning-sheet-decision-recovery"
          className="flex flex-col gap-2"
        >
          <Text variant="small" tone="secondary">
            {t(
              "A newer proposal replaced the one you were editing. Your earlier draft is saved.",
              "新提议已替换你正在编辑的提议。先前的草稿已保存。",
            )}
          </Text>
          <Button
            variant="secondary"
            size="small"
            disabled={isBusy}
            onClick={onRecoverDraft}
          >
            {t("Bring back my draft", "恢复我的草稿")}
          </Button>
        </div>
      ) : null}
      <Input
        id={`decision-edit-${proposal.id}`}
        label={t("Edited alternative (optional)", "编辑后的替代方案（选填）")}
        labelVariant="small-medium"
        type="textarea"
        rows={5}
        value={draft}
        disabled={isBusy}
        placeholder={stripFrontmatter(proposal.body ?? "").slice(0, 120)}
        onChange={(event) => onDraftChange(event.target.value)}
      />
      <div
        data-slot="skill-learning-sheet-decision-actions"
        className="flex flex-wrap gap-2"
      >
        <Button
          variant="secondary"
          size="small"
          disabled={isBusy}
          onClick={() => onDecide(proposal.id, "keep_current")}
        >
          {t("Keep current", "保留当前版本")}
        </Button>
        <Button
          variant="primary"
          size="small"
          disabled={isBusy}
          onClick={() => onDecide(proposal.id, "apply")}
        >
          {t("Apply change", "应用变更")}
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isBusy || !draft.trim()}
          onClick={() => onDecide(proposal.id, "apply_edited")}
        >
          {t("Apply edited alternative", "应用编辑后的方案")}
        </Button>
      </div>
    </section>
  );
}
