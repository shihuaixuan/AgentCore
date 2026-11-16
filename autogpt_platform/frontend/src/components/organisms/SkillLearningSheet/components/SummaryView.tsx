"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { SkillLearningDetail } from "@/app/api/__generated__/models/skillLearningDetail";
import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { reuseLabel, versionLabel } from "@/services/skill-learning/helpers";
import { formatDistanceToNow } from "date-fns";
import { OutcomeReportRequestOutcome } from "@/app/api/__generated__/models/outcomeReportRequestOutcome";
import { SkillPolicyRequest } from "@/app/api/__generated__/models/skillPolicyRequest";
import { SourceRemovedNotice } from "./SourceRemovedNotice";

interface Props {
  detail: SkillLearningDetail;
  version: SkillVersionSummary | null;
  isBusy: boolean;
  onPolicy: (data: SkillPolicyRequest) => void;
  onEdit: () => void;
  onReport: (versionId: string, outcome: OutcomeReportRequestOutcome) => void;
}

function stateVariant(state: string) {
  if (state === "ready") return "success" as const;
  if (state === "blocked_content" || state === "invalidated")
    return "error" as const;
  if (state === "needs_decision" || state === "paused")
    return "warning" as const;
  return "info" as const;
}

export function SummaryView({
  detail,
  version,
  isBusy,
  onPolicy,
  onEdit,
  onReport,
}: Props) {
  const { t } = useTranslation();
  const isCurrent =
    version != null && version.id === detail.current_version?.id;
  const badgeState = version && !isCurrent ? version.state : detail.state;
  const badgeLabel =
    version && !isCurrent ? version.state_label : detail.state_label;
  return (
    <div
      data-slot="skill-learning-sheet-summary"
      className="flex flex-col gap-5"
    >
      <div
        data-slot="skill-learning-sheet-summary-header"
        className="flex flex-wrap items-center gap-2"
      >
        <span
          data-slot="skill-learning-sheet-summary-state"
          data-testid="version-state"
        >
          <Badge variant={stateVariant(badgeState)}>{badgeLabel}</Badge>
        </span>
        {version ? (
          <Text variant="small" tone="muted" as="span">
            {versionLabel(version)} ·{" "}
            {formatDistanceToNow(new Date(version.created_at), {
              addSuffix: true,
            })}
            {isCurrent ? "" : t(" · not the current version", " · 非当前版本")}
          </Text>
        ) : null}
      </div>
      {version && !isCurrent ? (
        <Text variant="small" tone="muted">
          {t(
            `Skill now: ${detail.state_label}. The controls below apply to the skill as a whole, not to this historical version.`,
            `技能当前状态：${detail.state_label}。下方控制项适用于整个技能，而非此历史版本。`,
          )}
        </Text>
      ) : null}
      {isCurrent && version?.state === "invalidated" ? (
        <SourceRemovedNotice usePaused={detail.policy.use_paused} />
      ) : null}
      {version ? (
        <>
          <Text variant="body" tone="primary">
            {version.summary || version.description}
          </Text>
          <section
            data-slot="skill-learning-sheet-summary-evidence"
            aria-label={t("Evidence", "依据")}
          >
            <Text variant="small-medium" tone="primary">
              {t("Evidence", "依据")}
            </Text>
            <ul
              data-slot="skill-learning-sheet-summary-evidence-list"
              className="mt-1 flex flex-col gap-1"
            >
              {(version.evidence ?? []).map((item) => (
                <li
                  key={`${item.kind}-${item.ref}-${item.label}`}
                  data-slot="skill-learning-sheet-summary-evidence-item"
                >
                  <Text variant="small" tone="secondary">
                    {item.label}
                  </Text>
                </li>
              ))}
              <li data-slot="skill-learning-sheet-summary-evidence-reuse">
                <Text
                  variant="small"
                  tone="secondary"
                  data-testid="reuse-label"
                >
                  {reuseLabel(version)}
                </Text>
              </li>
            </ul>
          </section>
          {(version.limits ?? []).length > 0 ? (
            <section
              data-slot="skill-learning-sheet-summary-limits"
              aria-label={t("Limits", "限制")}
            >
              <Text variant="small-medium" tone="primary">
                {t("Limits", "限制")}
              </Text>
              <ul
                data-slot="skill-learning-sheet-summary-limits-list"
                className="mt-1 list-disc pl-4"
              >
                {(version.limits ?? []).map((limit) => (
                  <li
                    key={limit}
                    data-slot="skill-learning-sheet-summary-limits-item"
                  >
                    <Text variant="small" tone="secondary">
                      {limit}
                    </Text>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {version.blocked_pattern_class ? (
            <Text variant="small" tone="danger">
              {t(
                `Blocked by content check: ${version.blocked_pattern_class} at ${version.blocked_step}. Replace the value with a typed input.`,
                `内容检查已阻止此版本：步骤 ${version.blocked_step} 中存在 ${version.blocked_pattern_class}。请将该值替换为带类型的输入。`,
              )}
            </Text>
          ) : null}
        </>
      ) : (
        <Text variant="small" tone="muted">
          {t("No version has been published yet.", "尚未发布任何版本。")}
        </Text>
      )}
      <section
        aria-label={t("Learning controls", "学习控制")}
        data-slot="skill-learning-sheet-summary-controls"
        className="flex flex-col gap-3"
      >
        <label
          data-slot="skill-learning-sheet-summary-auto-improve"
          className="flex items-center justify-between gap-3"
        >
          <Text variant="small" tone="primary">
            {t("Automatic improvements", "自动改进")}
          </Text>
          <Switch
            checked={detail.policy.auto_improve}
            disabled={isBusy}
            aria-label={t("Automatic improvements", "自动改进")}
            onCheckedChange={(checked) => onPolicy({ auto_improve: checked })}
          />
        </label>
        <div
          data-slot="skill-learning-sheet-summary-pause-actions"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="secondary"
            size="small"
            disabled={isBusy}
            onClick={() =>
              onPolicy({ learning_paused: !detail.policy.learning_paused })
            }
          >
            {detail.policy.learning_paused
              ? t("Resume learning", "恢复学习")
              : t("Pause learning", "暂停学习")}
          </Button>
          <Button
            variant="secondary"
            size="small"
            disabled={isBusy}
            onClick={() => onPolicy({ use_paused: !detail.policy.use_paused })}
          >
            {detail.policy.use_paused
              ? t("Resume using this skill", "恢复使用此技能")
              : t("Stop using this skill", "停止使用此技能")}
          </Button>
        </div>
        <Text variant="small" tone="muted">
          {t(
            "Pause learning stops future automatic changes only; stop using removes the skill from retrieval. Each is separate.",
            "暂停学习仅阻止后续自动变更；停止使用则会将此技能从检索中移除。两项操作互相独立。",
          )}
        </Text>
        <div
          data-slot="skill-learning-sheet-summary-edit-actions"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="secondary"
            size="small"
            disabled={isBusy || !isCurrent}
            title={
              !version
                ? t(
                    "Editing is available after a version is published.",
                    "发布版本后即可编辑。",
                  )
                : isCurrent
                  ? undefined
                  : t(
                      "Editing starts from the current version. Restore this version first to build on it.",
                      "编辑将从当前版本开始。若要基于此版本编辑，请先恢复它。",
                    )
            }
            onClick={onEdit}
          >
            {t("Edit skill", "编辑技能")}
          </Button>
          {version ? (
            <>
              <Button
                variant="ghost"
                size="small"
                disabled={isBusy}
                onClick={() => onReport(version.id, "succeeded")}
              >
                {t("Report: it worked", "反馈：有效")}
              </Button>
              <Button
                variant="ghost"
                size="small"
                disabled={isBusy}
                onClick={() => onReport(version.id, "failed")}
              >
                {t("Report: it failed", "反馈：失败")}
              </Button>
            </>
          ) : null}
        </div>
        <Text variant="small" tone="muted">
          {t(
            `Edit skill applies your correction now${isCurrent ? "" : " (available on the current version)"}. Report an outcome adds evidence for a later review without changing the skill.`,
            `编辑技能会立即应用你的修改${isCurrent ? "" : "（当前版本可用）"}。反馈结果会为后续审核提供依据，不会修改技能。`,
          )}
        </Text>
      </section>
    </div>
  );
}
