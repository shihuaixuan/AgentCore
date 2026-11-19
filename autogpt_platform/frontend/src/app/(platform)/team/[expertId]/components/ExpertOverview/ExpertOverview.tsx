"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  BubbleChatIcon,
  File02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { ExpertActivity } from "@/app/api/__generated__/models/expertActivity";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { PanelEmptyState } from "@/app/(platform)/copilot/components/ContextPanel/components/PanelEmptyState/PanelEmptyState";
import { Icon } from "@/components/atoms/Icon/Icon";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { formatExpertIntro } from "@/services/experts/expert-intro";
import { ExpertSummaryCard } from "../ExpertSummaryCard";
import { ActivityChart } from "./components/ActivityChart";
import { LatestOutputs } from "./components/LatestOutputs";
import { OverviewCard } from "./components/OverviewCard";
import { RecentConversations } from "./components/RecentConversations";
import { StatTile } from "./components/StatTile";
import { formatDelta, getBioLead } from "./helpers";
import { useExpertOverview } from "./useExpertOverview";

interface Props {
  expert: Expert;
  activity: ExpertActivity | null;
  isActivityLoading: boolean;
  isActivityError: boolean;
  onChat: () => void;
}

/** How the expert has been doing: headline numbers, the last 30 days of
 *  conversations and runs, and what it most recently said and made. */
export function ExpertOverview({
  expert,
  activity,
  isActivityLoading,
  isActivityError,
  onChat,
}: Props) {
  const { t, locale } = useTranslation();
  const title = getExpertDisplayTitle(expert, locale);
  const overview = useExpertOverview(expert.id, activity);

  return (
    <div className="flex flex-col gap-4">
      {expert.bio ? (
        <Text variant="body-md" tone="secondary">
          {getBioLead(formatExpertIntro(expert.bio, expert.name, title))}
        </Text>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("Conversations", "对话")}
          icon={BubbleChatIcon}
          value={activity ? overview.conversations.current : null}
          detail={
            activity
              ? formatDelta(overview.conversations.delta, locale)
              : t("Last 30 days", "最近 30 天")
          }
          isLoading={isActivityLoading}
        />
        <StatTile
          label={t("Workflow runs", "工作流运行记录")}
          icon={PlayIcon}
          value={activity ? overview.runs.current : null}
          detail={
            activity
              ? formatDelta(overview.runs.delta, locale)
              : t("Last 30 days", "最近 30 天")
          }
          isLoading={isActivityLoading}
        />
        <StatTile
          label={t("Outputs", "输出")}
          icon={File02Icon}
          value={overview.isOutputsError ? null : overview.outputCount}
          detail={
            overview.isOutputsError
              ? "Unavailable"
              : overview.hasMoreOutputs
                ? "Showing the latest 200"
                : "All time"
          }
          isLoading={overview.isOutputsLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <OverviewCard title={t("Last 30 days", "最近 30 天")}>
          {isActivityLoading ? (
            <Skeleton className="h-56 w-full rounded-lg" />
          ) : isActivityError ? (
            <Text variant="small" tone="muted">
              {t(
                "Couldn't load the last 30 days.",
                "无法加载最近 30 天的数据。",
              )}
            </Text>
          ) : overview.hasActivity ? (
            <ActivityChart days={overview.chartDays} />
          ) : (
            <PanelEmptyState
              textSize="body-md"
              tiles={[
                <span key="a" className="inline-flex text-sky">
                  <Icon icon={BubbleChatIcon} size={22} />
                </span>,
                <span key="b" className="inline-flex text-orange">
                  <Icon icon={PlayIcon} size={22} />
                </span>,
                <span key="c" className="inline-flex text-brand">
                  <Icon icon={File02Icon} size={22} />
                </span>,
              ]}
              title={t("Nothing to chart yet", "暂无可绘制的数据")}
              description={t(
                `Once ${title} starts chatting and running workflows, each day shows up here.`,
                `${title} 开始聊天和运行工作流后，每天的活动会显示在这里。`,
              )}
            />
          )}
        </OverviewCard>
        <ExpertSummaryCard
          expert={expert}
          activity={activity}
          isActivityLoading={isActivityLoading}
          isActivityError={isActivityError}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentConversations
          expertName={title}
          sessions={overview.sessions}
          isLoading={overview.isSessionsLoading}
          isError={overview.isSessionsError}
          onRetry={overview.retrySessions}
          onChat={onChat}
        />
        <LatestOutputs
          expertName={title}
          outputs={overview.outputs}
          isLoading={overview.isOutputsLoading}
          isError={overview.isOutputsError}
          onRetry={overview.retryOutputs}
        />
      </div>
    </div>
  );
}
