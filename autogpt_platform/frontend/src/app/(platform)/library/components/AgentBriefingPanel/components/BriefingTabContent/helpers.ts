import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import type { AgentStatusFilter } from "@/app/(platform)/library/types";
import {
  englishDisplayText,
  type DisplayTranslate,
} from "@/app/(platform)/library/helpers/translation";

export const MAX_VISIBLE = 6;

const TAB_STATUS_LABEL: Record<string, string> = {
  listening: "Waiting for trigger event",
  scheduled: "Has a scheduled run",
  idle: "No recent activity",
};

export function getAgentStatusLabel(
  tab: string,
  agent: LibraryAgent,
  t: DisplayTranslate = englishDisplayText,
): string {
  if (tab === "scheduled" && agent.next_scheduled_run) {
    const diff = new Date(agent.next_scheduled_run).getTime() - Date.now();
    const minutes = Math.round(diff / 60_000);
    if (minutes <= 0) return t("Scheduled to run soon", "即将按计划运行");
    if (minutes < 60)
      return t(
        `Scheduled to run in ${minutes}m`,
        `计划在 ${minutes} 分钟后运行`,
      );
    const hours = Math.round(minutes / 60);
    if (hours < 24)
      return t(`Scheduled to run in ${hours}h`, `计划在 ${hours} 小时后运行`);
    const days = Math.round(hours / 24);
    return t(`Scheduled to run in ${days}d`, `计划在 ${days} 天后运行`);
  }
  const labels: Record<string, string> = {
    listening: "等待触发事件",
    scheduled: "有计划运行的任务",
    idle: "近期无活动",
  };
  return t(TAB_STATUS_LABEL[tab] ?? "", labels[tab] ?? "");
}

const EMPTY_MESSAGES: Record<string, string> = {
  running: "No workflows running right now",
  attention: "No workflows that need attention",
  completed: "No recently completed tasks",
  listening: "No workflows listening for events",
  scheduled: "No workflows with scheduled tasks",
  idle: "No idle workflows",
};

export function getEmptyMessage(
  tab: AgentStatusFilter,
  t: DisplayTranslate = englishDisplayText,
): string {
  const messages: Record<string, string> = {
    running: "当前没有正在运行的工作流",
    attention: "没有需要处理的工作流",
    completed: "近期没有已完成的任务",
    listening: "没有正在监听事件的工作流",
    scheduled: "没有包含计划任务的工作流",
    idle: "没有空闲的工作流",
  };
  return t(
    EMPTY_MESSAGES[tab] ?? "No workflows in this category",
    messages[tab] ?? "此分类下没有工作流",
  );
}
