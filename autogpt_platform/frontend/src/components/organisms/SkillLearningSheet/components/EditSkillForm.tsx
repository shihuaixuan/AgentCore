"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { lineDiff } from "@/services/skill-learning/helpers";
import { SkillEditDraft } from "../useSkillReviewState";

interface Props {
  currentVersion: SkillVersionSummary | null;
  draft: SkillEditDraft;
  isBusy: boolean;
  onDraftChange: (patch: Partial<SkillEditDraft>) => void;
  onReviewCurrent: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditSkillForm({
  currentVersion,
  draft,
  isBusy,
  onDraftChange,
  onReviewCurrent,
  onSave,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const hasNewerVersion = draft.baseVersionId !== (currentVersion?.id ?? null);
  return (
    <form
      data-slot="edit-skill-form"
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!hasNewerVersion && !isBusy) onSave();
      }}
      aria-label={t("Edit skill", "编辑技能")}
    >
      <Text variant="small" tone="muted">
        {t(
          "Your edit takes effect immediately and becomes a new version. The same content checks apply.",
          "你的修改会立即生效并成为新版本，仍需通过相同的内容检查。",
        )}
      </Text>
      {hasNewerVersion && currentVersion ? (
        <section
          aria-label={t("Newer version available", "有新版本可用")}
          data-slot="edit-skill-form-conflict"
          className="rounded-lg border border-warning-border bg-warning-surface p-3"
        >
          <Text variant="small" tone="primary">
            {t(
              `v${currentVersion.version} was saved while you were editing. Your draft is kept. Compare it with the current version before saving.`,
              `你编辑期间已保存版本 v${currentVersion.version}。草稿已保留，请在保存前与当前版本比较。`,
            )}
          </Text>
          <details
            data-slot="edit-skill-form-conflict-details"
            className="mt-2"
          >
            <summary
              data-slot="edit-skill-form-conflict-summary"
              className="cursor-pointer text-body font-medium"
            >
              {t(
                `Review changes against v${currentVersion.version}`,
                `查看与 v${currentVersion.version} 的差异`,
              )}
            </summary>
            {draft.description !== currentVersion.description ? (
              <Text variant="small" tone="secondary" className="mt-2">
                {t(
                  `Current description: ${currentVersion.description}`,
                  `当前描述：${currentVersion.description}`,
                )}
              </Text>
            ) : null}
            <pre
              data-slot="edit-skill-form-conflict-diff"
              className="my-3 overflow-x-auto rounded-lg bg-action-hover p-3 text-caption text-action-foreground"
            >
              {lineDiff(currentVersion.body ?? "", draft.body) ||
                t(
                  "Your procedure matches the current version.",
                  "你的操作步骤与当前版本一致。",
                )}
            </pre>
            <Button
              type="button"
              variant="secondary"
              size="small"
              disabled={isBusy}
              onClick={onReviewCurrent}
            >
              {t(
                `Continue editing from v${currentVersion.version}`,
                `基于 v${currentVersion.version} 继续编辑`,
              )}
            </Button>
          </details>
        </section>
      ) : null}
      <Input
        id="skill-edit-description"
        label={t("Description", "描述")}
        labelVariant="small-medium"
        value={draft.description}
        maxLength={1024}
        required
        disabled={isBusy}
        onChange={(event) => onDraftChange({ description: event.target.value })}
      />
      <Input
        id="skill-edit-body"
        label={t("Procedure (Markdown)", "操作步骤（Markdown）")}
        labelVariant="small-medium"
        type="textarea"
        rows={12}
        value={draft.body}
        required
        disabled={isBusy}
        onChange={(event) => onDraftChange({ body: event.target.value })}
      />
      <label
        data-slot="edit-skill-form-auto-improve"
        className="flex items-center justify-between gap-3"
      >
        <span
          data-slot="edit-skill-form-auto-improve-text"
          className="flex flex-col"
        >
          <Text variant="small" tone="primary">
            {t("Keep automatic improvements on", "保持自动改进开启")}
          </Text>
          <Text variant="small" tone="muted">
            {t(
              "Off by default after an edit: later automated changes become proposals for you to decide.",
              "手动编辑后默认关闭：后续自动变更将作为提议，由你决定是否应用。",
            )}
          </Text>
        </span>
        <Switch
          checked={draft.keepAutoImprove}
          disabled={isBusy}
          aria-label={t("Keep automatic improvements on", "保持自动改进开启")}
          onCheckedChange={(checked) =>
            onDraftChange({ keepAutoImprove: checked })
          }
        />
      </label>
      <div
        data-slot="edit-skill-form-actions"
        className="flex justify-end gap-2"
      >
        <Button
          type="button"
          variant="ghost"
          size="small"
          disabled={isBusy}
          onClick={onCancel}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="small"
          loading={isBusy}
          disabled={hasNewerVersion}
        >
          {t("Save edit", "保存修改")}
        </Button>
      </div>
    </form>
  );
}
