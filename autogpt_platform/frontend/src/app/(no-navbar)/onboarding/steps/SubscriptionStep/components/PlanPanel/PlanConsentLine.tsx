"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { RecommendedExpert } from "@/app/api/__generated__/models/recommendedExpert";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { type ConsentMoment, consentLine } from "./helpers";

const FACE_SIZE = 24;

interface Props {
  team: RecommendedExpert[];
  moment: ConsentMoment;
}

// Who joins, and when: the line that makes the plan a promise, not a hire.
export function PlanConsentLine({ team, moment }: Props) {
  const { t, locale } = useTranslation();
  const members = team.map((expert) => ({
    expert,
    title: getExpertDisplayTitle(expert, locale),
  }));
  const titles = members.map(({ title }) => title);
  return (
    <div className="flex items-center gap-2.5">
      {team.length > 0 ? (
        <span aria-hidden className="flex shrink-0 -space-x-1.5">
          {members.map(({ expert, title }) => (
            // The ring separates the overlapping faces; it follows the
            // avatar's own rounded-xl corner.
            <span
              key={expert.template_id}
              className="flex rounded-xl ring-2 ring-surface-muted"
            >
              <ExpertAvatar
                name={title}
                avatarUrl={expert.avatar_url ?? null}
                size={FACE_SIZE}
              />
            </span>
          ))}
        </span>
      ) : null}
      <Text variant="small" as="p" tone="secondary" className="text-pretty">
        {t(
          consentLine(titles, moment),
          team.length === 0
            ? "这些工作暂由助手负责。你可以随时聘用专家。选择任务后才会开始执行。"
            : `${titles.join("、")}将在${moment === "trial" ? "试用开始" : moment === "subscribe" ? "订阅" : "继续"}时加入团队。选择任务后才会开始执行。`,
        )}
      </Text>
    </div>
  );
}
