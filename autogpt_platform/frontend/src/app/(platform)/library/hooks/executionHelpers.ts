import { AgentExecutionStatus } from "@/app/api/__generated__/models/agentExecutionStatus";
import type { GraphExecutionMeta } from "@/app/api/__generated__/models/graphExecutionMeta";
import {
  englishDisplayText,
  type DisplayTranslate,
} from "../helpers/translation";

export const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

// Shared scheduled-predicate used by fleet summary, sitrep, status-map, and the
// list filter so the four call sites stay in lockstep. Only the current user's
// actual schedule (`is_scheduled`) counts — `recommended_schedule_cron` is a
// creator-defined suggestion shared by every user, not an active schedule.
export function isAgentScheduled(agent: { is_scheduled?: boolean }): boolean {
  return !!agent.is_scheduled;
}

export function isActive(status: string): boolean {
  return (
    status === AgentExecutionStatus.RUNNING ||
    status === AgentExecutionStatus.QUEUED ||
    status === AgentExecutionStatus.REVIEW
  );
}

export function isFailed(status: string): boolean {
  return (
    status === AgentExecutionStatus.FAILED ||
    status === AgentExecutionStatus.TERMINATED
  );
}

export function toEndTime(exec: GraphExecutionMeta): number {
  if (!exec.ended_at) return 0;
  return exec.ended_at instanceof Date
    ? exec.ended_at.getTime()
    : new Date(exec.ended_at).getTime();
}

export function endedAfter(exec: GraphExecutionMeta, cutoff: number): boolean {
  if (!exec.ended_at) return false;
  return toEndTime(exec) > cutoff;
}

export function runningMessage(
  status: string,
  startedAt?: string | Date | null,
  t: DisplayTranslate = englishDisplayText,
): string {
  if (status === AgentExecutionStatus.QUEUED)
    return t("Queued for execution", "排队等待执行");
  if (status === AgentExecutionStatus.REVIEW)
    return t("Awaiting review", "等待审核");
  if (!startedAt) return t("Currently executing", "正在执行");
  const ms =
    Date.now() -
    (startedAt instanceof Date
      ? startedAt.getTime()
      : new Date(startedAt).getTime());
  return t(
    `Running for ${formatRelativeDuration(ms)}`,
    `已运行 ${formatRelativeDuration(ms, t)}`,
  );
}

export function formatRelativeDuration(
  ms: number,
  t: DisplayTranslate = englishDisplayText,
): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return t("a few seconds", "几秒");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t(`${minutes}m`, `${minutes} 分钟`);
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  if (hours < 24)
    return remainingMin > 0
      ? t(`${hours}h ${remainingMin}m`, `${hours} 小时 ${remainingMin} 分钟`)
      : t(`${hours}h`, `${hours} 小时`);
  const days = Math.floor(hours / 24);
  return t(`${days}d ${hours % 24}h`, `${days} 天 ${hours % 24} 小时`);
}
