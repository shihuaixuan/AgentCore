"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { WorkHistoryIcon } from "@hugeicons/core-free-icons";
import type { HomeDashboardResponse } from "@/app/api/__generated__/models/homeDashboardResponse";
import type { HomeRecentWorkGroup } from "@/app/api/__generated__/models/homeRecentWorkGroup";
import { Text } from "@/components/atoms/Text/Text";
import { useTrackFunnelViewOnce } from "@/services/experts/use-track-funnel-view-once";
import { HomeTile } from "../HomeTile/HomeTile";
import { HomeTileEmpty } from "../HomeTileEmpty/HomeTileEmpty";
import { BriefingByline } from "./components/BriefingByline";
import { WorkGroup } from "./components/WorkGroup";
import { splitGroupsBySection } from "./helpers";

interface Props {
  dashboard: HomeDashboardResponse;
  className?: string;
}

/** One card for what the agents did this week: the team (each expert and
 *  Otto) first, then the workflows that ran on their own. */
export function RecentWork({ dashboard, className }: Props) {
  const { t } = useTranslation();
  const { briefing } = dashboard;
  const groups = dashboard.recent_work?.groups ?? [];
  const { team, workflows } = splitGroupsBySection(groups);
  const completed = dashboard.recent_work?.completed_count ?? 0;
  const failed = dashboard.recent_work?.failed_count ?? 0;
  const isEmpty = groups.length === 0 && !briefing.narrative;

  // An exposure event: the briefing is an inline byline with no expand step,
  // so it counts as opened once its content actually renders.
  useTrackFunnelViewOnce("briefing_opened", Boolean(briefing.narrative));

  return (
    <HomeTile
      className={className}
      icon={WorkHistoryIcon}
      title={t("Recent work", "最近工作")}
      meta={
        <>
          <Text
            variant="small"
            as="span"
            tone="muted"
            className="hidden sm:inline"
          >
            {t("This week", "本周")}
          </Text>
          <span
            aria-hidden="true"
            className="hidden text-foreground-disabled sm:inline"
          >
            ·
          </span>
          <Text variant="small" as="span" tone="muted" tabular>
            {t(`${completed} completed`, `${completed} 项已完成`)}
          </Text>
          {failed > 0 ? (
            <Text variant="small" as="span" tone="danger" tabular>
              {t(`${failed} failed`, `${failed} 项失败`)}
            </Text>
          ) : null}
        </>
      }
    >
      {isEmpty ? (
        <HomeTileEmpty
          title={t("Nothing to show yet", "暂无内容")}
          description={t(
            "Runs, files, integrations and schedules from your experts and workflows will appear here.",
            "专家和工作流产生的运行记录、文件、集成和计划会显示在这里。",
          )}
        />
      ) : (
        <div className="divide-y divide-border-base">
          {briefing.narrative ? <BriefingByline briefing={briefing} /> : null}
          {[...team, ...workflows].map((group) => (
            <WorkGroup
              key={groupKey(group)}
              group={group}
              timezone={dashboard.timezone}
            />
          ))}
        </div>
      )}
    </HomeTile>
  );
}

function groupKey(group: HomeRecentWorkGroup) {
  return group.runs?.[0]?.id ?? group.items?.[0]?.id ?? group.actor.name;
}
