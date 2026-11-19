"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { HomeAgentStatus } from "@/app/api/__generated__/models/homeAgentStatus";
import { Button } from "@/components/atoms/Button/Button";
import { BubbleChatIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { trackFunnel } from "@/services/experts/experts-analytics";
import { formatWeeklySpend } from "../../../helpers";
import { formatUntil } from "../../NowNext/helpers";
import { StatusBadge } from "./StatusBadge";

interface Props {
  agent: HomeAgentStatus;
}

/** One expert with its status and two ways in. The detail line is gone:
 *  anything that needs doing is already spelled out under Needs you. */
export function AgentRow({ agent }: Props) {
  const { t, locale } = useTranslation();
  const title = getExpertDisplayTitle(agent.expert, locale);
  const spend = formatWeeklySpend(agent.spend_cents, t);
  const nextRun = agent.next_run_time
    ? t(
        `Next run ${formatUntil(agent.next_run_time)}`,
        `下次运行：${formatUntil(agent.next_run_time, undefined, t, locale)}`,
      )
    : null;
  const secondLine = [spend, nextRun].filter(Boolean).join(" · ");

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-2.5">
      <ExpertAvatar
        name={title}
        avatarUrl={agent.expert.avatar_url}
        size={32}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Text variant="body-medium-tight" tone="primary" className="truncate">
            {title}
          </Text>
          <StatusBadge status={agent.status} />
        </div>
        <Text variant="small" tone="secondary" className="break-words">
          {agent.detail || t("No status details available.", "暂无状态详情。")}{" "}
          {agent.status === "failed"
            ? t(
                "Open Manage to inspect recent work.",
                "打开管理页面查看最近的工作。",
              )
            : agent.status === "needs_setup"
              ? t("Open Manage to finish setup.", "打开管理页面完成设置。")
              : agent.status === "paused"
                ? t("Open Manage to review settings.", "打开管理页面查看设置。")
                : t("Open Chat to give instructions.", "打开聊天以提供指令。")}
        </Text>
        {secondLine ? (
          <Text variant="small-tight" tone="muted" tabular className="truncate">
            {secondLine}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Icon-only: the atom shows the aria-label as a hover tooltip. */}
        <Button
          as="NextLink"
          href={`/copilot?expertId=${agent.expert.id}`}
          variant="icon"
          size="icon-sm"
          leadingIcon={BubbleChatIcon}
          aria-label={t(`Chat with ${title}`, `与 ${title} 聊天`)}
        />
        <Button
          as="NextLink"
          href={`/team/${agent.expert.id}`}
          variant="icon"
          size="icon-sm"
          leadingIcon={Settings01Icon}
          aria-label={t(`Manage ${title}`, `管理 ${title}`)}
          onClick={() =>
            trackFunnel("home_team_member_clicked", {
              expert_id: agent.expert.id,
            })
          }
        />
      </div>
    </div>
  );
}
