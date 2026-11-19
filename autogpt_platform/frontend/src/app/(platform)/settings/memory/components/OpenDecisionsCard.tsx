"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { DecisionRequestAction } from "@/app/api/__generated__/models/decisionRequestAction";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { skillDetailHref } from "@/services/skill-learning/helpers";
import Link from "next/link";

interface Props {
  decisions: SkillVersionSummary[];
  experts: Expert[];
  isDeciding: boolean;
  onDecide: (
    proposal: SkillVersionSummary,
    action: DecisionRequestAction,
  ) => void;
}

export function OpenDecisionsCard({
  decisions,
  experts,
  isDeciding,
  onDecide,
}: Props) {
  const { t, locale } = useTranslation();
  if (decisions.length === 0) return null;
  return (
    <div
      className="flex flex-col rounded-large border border-warning-border bg-warning-surface/40 px-4 py-4 shadow-message-table"
      data-testid="open-decisions-card"
    >
      <Text variant="body-medium" as="span">
        {t("Needs your decision", "需要你决策")}
      </Text>
      <Text variant="small" as="span" tone="muted">
        {t(
          "Proposed changes to skills you control. Unrelated learning continues.",
          "对你管理的技能提出的修改建议。其他学习仍会继续。",
        )}
      </Text>
      <ul className="mt-2 flex flex-col divide-y divide-warning/20">
        {decisions.map((proposal) => (
          <li
            key={proposal.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Text variant="small-medium" as="span">
                <Link
                  href={skillDetailHref({
                    expertId: proposal.expert_id,
                    skillName: proposal.skill_name,
                    versionId: proposal.id,
                  })}
                  className="underline-offset-2 hover:underline"
                >
                  {proposal.skill_name}
                </Link>
                {" · "}
                {proposal.expert_id
                  ? getExpertDisplayTitle(
                      experts.find(
                        (expert) => expert.id === proposal.expert_id,
                      ),
                      locale,
                    )
                  : "Otto"}
              </Text>
              <Text variant="small" as="p" tone="secondary">
                {proposal.summary || proposal.description} —{" "}
                {proposal.state_reason}
              </Text>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={isDeciding}
                onClick={() => onDecide(proposal, "keep_current")}
              >
                {t("Keep current", "保留当前版本")}
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={isDeciding}
                onClick={() => onDecide(proposal, "apply")}
              >
                {t("Apply change", "应用修改")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
