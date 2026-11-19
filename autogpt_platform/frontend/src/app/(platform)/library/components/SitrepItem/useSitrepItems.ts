"use client";

import { useGetV1ListAllExecutions } from "@/app/api/__generated__/endpoints/graphs/graphs";
import { AgentExecutionStatus } from "@/app/api/__generated__/models/agentExecutionStatus";
import type { GraphExecutionMeta } from "@/app/api/__generated__/models/graphExecutionMeta";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { okData } from "@/app/api/helpers";
import {
  describeFailedSteps,
  getFailedStepCount,
  isCompletedWithErrors,
} from "@/lib/run-health";
import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { DisplayTranslate } from "../../helpers/translation";
import type { SitrepItemData, SitrepPriority } from "../../types";
import {
  isActive,
  isAgentScheduled,
  isFailed,
  toEndTime,
  endedAfter,
  runningMessage,
  SEVENTY_TWO_HOURS_MS,
} from "../../hooks/executionHelpers";

export function useSitrepItems(
  agents: LibraryAgent[],
  maxItems: number,
  scheduledWithinMs?: number,
): SitrepItemData[] {
  const { t } = useTranslation();
  const { data: executions } = useGetV1ListAllExecutions({
    query: { select: okData },
  });

  return useMemo(() => {
    if (agents.length === 0) return [];

    const graphIdToAgent = new Map(agents.map((a) => [a.graph_id, a]));
    const agentExecutions = groupByAgent(executions ?? [], graphIdToAgent);
    const items: SitrepItemData[] = [];
    const coveredAgentIds = new Set<string>();

    for (const [agent, execs] of agentExecutions) {
      const item = buildSitrepFromExecutions(agent, execs, t);
      if (item) {
        items.push(item);
        coveredAgentIds.add(agent.id);
      }
    }

    for (const agent of agents) {
      if (coveredAgentIds.has(agent.id)) continue;
      const configItem = buildSitrepFromConfig(agent, scheduledWithinMs, t);
      if (configItem) items.push(configItem);
    }

    const order: Record<SitrepPriority, number> = {
      error: 0,
      running: 1,
      stale: 2,
      warning: 3,
      success: 4,
      listening: 5,
      scheduled: 6,
      idle: 7,
    };
    items.sort((a, b) => order[a.priority] - order[b.priority]);

    return items.slice(0, maxItems);
  }, [agents, executions, maxItems, scheduledWithinMs, t]);
}

function groupByAgent(
  executions: GraphExecutionMeta[],
  graphIdToAgent: Map<string, LibraryAgent>,
): Map<LibraryAgent, GraphExecutionMeta[]> {
  const map = new Map<LibraryAgent, GraphExecutionMeta[]>();

  for (const exec of executions) {
    const agent = graphIdToAgent.get(exec.graph_id);
    if (!agent) continue;
    const list = map.get(agent);
    if (list) {
      list.push(exec);
    } else {
      map.set(agent, [exec]);
    }
  }

  return map;
}

function buildSitrepFromExecutions(
  agent: LibraryAgent,
  executions: GraphExecutionMeta[],
  t: DisplayTranslate,
): SitrepItemData | null {
  const active = executions.find((e) => isActive(e.status));
  if (active) {
    return {
      id: `${agent.id}-${active.id}`,
      agentID: agent.id,
      agentName: agent.name,
      executionID: active.id,
      priority: "running",
      message:
        active.stats?.activity_status ??
        runningMessage(active.status, active.started_at, t),
      status: "running",
    };
  }

  const cutoff = Date.now() - SEVENTY_TWO_HOURS_MS;
  const recent = executions
    .filter((e) => endedAfter(e, cutoff))
    .sort((a, b) => toEndTime(b) - toEndTime(a));

  const lastFailed = recent.find((e) => isFailed(e.status));
  if (lastFailed) {
    const errorMsg =
      lastFailed.stats?.error ??
      lastFailed.stats?.activity_status ??
      t("Execution failed", "执行失败");
    return {
      id: `${agent.id}-${lastFailed.id}`,
      agentID: agent.id,
      agentName: agent.name,
      executionID: lastFailed.id,
      priority: "error",
      message:
        typeof errorMsg === "string"
          ? errorMsg
          : t("Execution failed", "执行失败"),
      status: "error",
    };
  }

  const lastCompleted = recent.find(
    (e) => e.status === AgentExecutionStatus.COMPLETED,
  );
  if (lastCompleted) {
    const summary = lastCompleted.stats?.activity_status;
    if (isCompletedWithErrors(lastCompleted)) {
      const failedStepCount = getFailedStepCount(lastCompleted);
      const failedSteps = t(
        describeFailedSteps(failedStepCount),
        `${failedStepCount} 个步骤失败`,
      );
      return {
        id: `${agent.id}-${lastCompleted.id}`,
        agentID: agent.id,
        agentName: agent.name,
        executionID: lastCompleted.id,
        priority: "warning",
        message: summary
          ? `${failedSteps} — ${summary}`
          : t(
              `Completed with errors: ${failedSteps}`,
              `已完成，但存在错误：${failedSteps}`,
            ),
        status: "idle",
      };
    }
    return {
      id: `${agent.id}-${lastCompleted.id}`,
      agentID: agent.id,
      agentName: agent.name,
      executionID: lastCompleted.id,
      priority: "success",
      message: summary ?? t("Completed successfully", "已成功完成"),
      status: "idle",
    };
  }

  return null;
}

function buildSitrepFromConfig(
  agent: LibraryAgent,
  scheduledWithinMs?: number,
  t: DisplayTranslate = (english) => english,
): SitrepItemData | null {
  if (agent.has_external_trigger) {
    return {
      id: `${agent.id}-listening`,
      agentID: agent.id,
      agentName: agent.name,
      priority: "listening",
      message: t("Waiting for trigger event", "等待触发事件"),
      status: "listening",
    };
  }

  if (isAgentScheduled(agent)) {
    if (!isNextRunWithin(agent.next_scheduled_run, scheduledWithinMs)) {
      return null;
    }
    return {
      id: `${agent.id}-scheduled`,
      agentID: agent.id,
      agentName: agent.name,
      priority: "scheduled",
      message: formatNextRun(agent.next_scheduled_run, t),
      status: "scheduled",
    };
  }

  return null;
}

function isNextRunWithin(
  iso: string | undefined | null,
  windowMs: number | undefined,
): boolean {
  if (windowMs === undefined) return true;
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= windowMs;
}

function formatNextRun(
  iso: string | undefined | null,
  t: DisplayTranslate,
): string {
  if (!iso) return t("Has a scheduled run", "有计划运行的任务");
  const diff = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(diff / 60_000);
  if (minutes <= 0) return t("Scheduled to run soon", "即将按计划运行");
  if (minutes < 60)
    return t(`Scheduled to run in ${minutes}m`, `计划在 ${minutes} 分钟后运行`);
  const hours = Math.round(minutes / 60);
  if (hours < 24)
    return t(`Scheduled to run in ${hours}h`, `计划在 ${hours} 小时后运行`);
  const days = Math.round(hours / 24);
  return t(`Scheduled to run in ${days}d`, `计划在 ${days} 天后运行`);
}
