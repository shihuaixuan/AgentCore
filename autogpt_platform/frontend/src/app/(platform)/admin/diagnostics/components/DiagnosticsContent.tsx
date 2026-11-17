"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import { DiagnosticAlertCard } from "./DiagnosticAlertCard";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useDiagnosticsContent } from "./useDiagnosticsContent";
import { ExecutionsTable } from "./ExecutionsTable";
import { SchedulesTable } from "./SchedulesTable";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function DiagnosticsContent() {
  const { t } = useTranslation();
  const {
    executionData,
    agentData,
    scheduleData,
    isLoading,
    isError,
    error,
    refresh,
  } = useDiagnosticsContent();

  const [activeTab, setActiveTab] = useState<
    "all" | "orphaned" | "failed" | "long-running" | "stuck-queued" | "invalid"
  >("all");

  if (isLoading && !executionData && !agentData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <span className="mx-auto block h-8 w-8 animate-spin text-foreground-subtle">
            <Icon icon={Refresh01Icon} className="h-8 w-8" />
          </span>
          <p className="mt-2 text-foreground-tertiary">
            {t("Loading diagnostics...", "正在加载诊断信息...")}
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorCard
        httpError={error as { status?: number; message?: string }}
        onRetry={refresh}
        context="diagnostics"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold">{t("System Diagnostics", "系统诊断")}</h1>
          <p className="text-foreground-tertiary">
            {t("Monitor execution and agent system health", "监控执行情况和工作流系统健康状态")}
          </p>
        </div>
        <Button
          onClick={refresh}
          disabled={isLoading}
          variant="outline"
          size="small"
        >
          <span
            className={cn("mr-2 block h-4 w-4", isLoading && "animate-spin")}
          >
            <Icon icon={Refresh01Icon} className="h-4 w-4" />
          </span>
          {t("Refresh", "刷新")}
        </Button>
      </div>

      {/* Alert Cards for Critical Issues */}
      <div className="grid gap-4 md:grid-cols-3">
        {executionData && (
          <>
            {(executionData.orphaned_running > 0 ||
              executionData.orphaned_queued > 0) && (
              <DiagnosticAlertCard
                tone="orange"
                title={t("Orphaned Executions", "孤立执行")}
                value={
                  executionData.orphaned_running + executionData.orphaned_queued
                }
                detail={
                  <>
                    {executionData.orphaned_running} {t("running", "运行中")}，{" "}
                    {executionData.orphaned_queued} {t("queued", "排队中")}（{">"}24h）
                  </>
                }
                hint={t("Click to view →", "点击查看 →")}
                onClick={() => setActiveTab("orphaned")}
              />
            )}

            {executionData.failed_count_24h > 0 && (
              <DiagnosticAlertCard
                tone="error"
                title={t("Failed Executions (24h)", "失败执行（24 小时）")}
                value={executionData.failed_count_24h}
                detail={
                  <>
                    {executionData.failed_count_1h} {t("in last hour", "过去一小时")}（
                    {executionData.failure_rate_24h.toFixed(1)}/hr）
                  </>
                }
                hint={t("Click to view →", "点击查看 →")}
                onClick={() => setActiveTab("failed")}
              />
            )}

            {executionData.stuck_running_24h > 0 && (
              <DiagnosticAlertCard
                tone="yellow"
                title={t("Long-Running Executions", "长时间运行的执行")}
                value={executionData.stuck_running_24h}
                detail={
                  <>
                    {t("Running", "运行时间")} {">"}24h（{t("oldest", "最早")}：{" "}
                    {executionData.oldest_running_hours
                      ? `${Math.floor(executionData.oldest_running_hours)}h`
                : t("N/A", "无")}
                    ）
                  </>
                }
                hint={t("Click to view →", "点击查看 →")}
                onClick={() => setActiveTab("long-running")}
              />
            )}

            {scheduleData && scheduleData.total_orphaned > 0 && (
              <DiagnosticAlertCard
                tone="brand"
                title={t("Orphaned Schedules", "孤立计划任务")}
                value={scheduleData.total_orphaned}
                detail={
                  <>
                    {scheduleData.orphaned_deleted_graph > 0 &&
                      `${scheduleData.orphaned_deleted_graph} ${t("deleted graph", "已删除工作流")}，`}
                    {scheduleData.orphaned_no_library_access > 0 &&
                      `${scheduleData.orphaned_no_library_access} ${t("no access", "无访问权限")}`}
                  </>
                }
                hint={t("Click to view schedules →", "点击查看计划任务 →")}
                onClick={() => setActiveTab("all")}
              />
            )}

            {(executionData.invalid_queued_with_start > 0 ||
              executionData.invalid_running_without_start > 0) && (
              <DiagnosticAlertCard
                tone="pink"
                title={t("Invalid States (Data Corruption)", "无效状态（数据损坏）")}
                value={
                  executionData.invalid_queued_with_start +
                  executionData.invalid_running_without_start
                }
                detail={t("Requires manual investigation", "需要人工调查")}
                hint={t("Click to view (read-only) →", "点击查看（只读） →")}
                onClick={() => setActiveTab("invalid")}
              />
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("Execution Queue Status", "执行队列状态")}</CardTitle>
            <CardDescription>
              {t("Current execution and queue metrics", "当前执行和队列指标")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executionData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Running Executions", "运行中的执行")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.running_executions}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/30">
                    <div className="h-6 w-6 rounded-full bg-success"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Queued in Database", "数据库中的排队执行")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.queued_executions_db}
                    </p>
                    {executionData.stuck_queued_1h > 0 && (
                      <p className="text-caption text-orange-foreground">
                        {executionData.stuck_queued_1h} stuck {">"}1h
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/20">
                    <div className="h-6 w-6 rounded-full bg-info"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Queued in RabbitMQ", "RabbitMQ 中的排队执行")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.queued_executions_rabbitmq === -1 ? (
                        <span className="text-lead text-error">{t("Error", "错误")}</span>
                      ) : (
                        executionData.queued_executions_rabbitmq
                      )}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      executionData.queued_executions_rabbitmq === -1
                        ? "bg-error-surface"
                        : "bg-yellow/30",
                    )}
                  >
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full",
                        executionData.queued_executions_rabbitmq === -1
                          ? "bg-error"
                          : "bg-yellow",
                      )}
                    ></div>
                  </div>
                </div>

                <div className="text-caption text-foreground-subtle">
                  {t("Last updated:", "最后更新：")}{" "}
                  {new Date(executionData.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-foreground-tertiary">{t("No data available", "暂无数据")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("System Throughput", "系统吞吐量")}</CardTitle>
            <CardDescription>
              {t("Execution completion and processing rates", "执行完成和处理速率")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executionData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Completed (24h)", "已完成（24 小时）")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.completed_24h}
                    </p>
                    <Text variant="small-tight" tone="secondary">
                      {executionData.completed_1h} {t("in last hour", "过去一小时")}
                    </Text>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/30">
                    <div className="h-6 w-6 rounded-full bg-success"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Throughput Rate", "吞吐速率")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.throughput_per_hour.toFixed(1)}
                    </p>
                    <Text variant="small-tight" tone="secondary">
                      {t("completions per hour", "每小时完成数")}
                    </Text>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/20">
                    <div className="h-6 w-6 rounded-full bg-info"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Cancel Queue Depth", "取消队列深度")}
                    </Text>
                    <p className="text-heading font-bold">
                      {executionData.cancel_queue_depth === -1 ? (
                        <span className="text-lead text-error">{t("Error", "错误")}</span>
                      ) : (
                        executionData.cancel_queue_depth
                      )}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-surface">
                    <div className="h-6 w-6 rounded-full bg-brand"></div>
                  </div>
                </div>

                <div className="text-caption text-foreground-subtle">
                  {t("Last updated:", "最后更新：")}{" "}
                  {new Date(executionData.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-foreground-tertiary">{t("No data available", "暂无数据")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Schedules", "计划任务")}</CardTitle>
            <CardDescription>
              {t("Scheduled agent executions and health", "计划执行和健康状态")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("User Schedules", "用户计划任务")}
                    </Text>
                    <p className="text-heading font-bold">
                      {scheduleData.user_schedules}
                    </p>
                    {scheduleData.total_orphaned > 0 && (
                      <p className="text-caption text-orange-foreground">
                        {scheduleData.total_orphaned} {t("orphaned", "个孤立")}
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-surface">
                    <div className="h-6 w-6 rounded-full bg-brand"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Upcoming Runs (1h)", "即将运行（1 小时）")}
                    </Text>
                    <p className="text-heading font-bold">
                      {scheduleData.total_runs_next_hour}
                    </p>
                    <Text variant="small-tight" tone="secondary">
                      {t("from", "来自")} {scheduleData.schedules_next_hour} {t("schedule(s)", "个计划任务")}
                    </Text>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/20">
                    <div className="h-6 w-6 rounded-full bg-info"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Text variant="body-medium-tight" tone="muted">
                      {t("Upcoming Runs (24h)", "即将运行（24 小时）")}
                    </Text>
                    <p className="text-heading font-bold">
                      {scheduleData.total_runs_next_24h}
                    </p>
                    <Text variant="small-tight" tone="secondary">
                      {t("from", "来自")} {scheduleData.schedules_next_24h} {t("schedule(s)", "个计划任务")}
                    </Text>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/30">
                    <div className="h-6 w-6 rounded-full bg-success"></div>
                  </div>
                </div>

                <div className="text-caption text-foreground-subtle">
                  {t("Last updated:", "最后更新：")}{" "}
                  {new Date(scheduleData.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-foreground-tertiary">{t("No data available", "暂无数据")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Diagnostic Information", "诊断信息")}</CardTitle>
          <CardDescription>
            {t("Understanding metrics and tabs for on-call diagnostics", "了解值班诊断所需的指标和选项卡")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-body">
            <div>
              <p className="font-semibold text-warning-foreground">
                🟠 Orphaned Executions:
              </p>
            <p className="text-foreground-secondary">
              {t("Executions >24h old in database but not actually running in executor. Usually from executor restarts/crashes. Safe to cleanup (marks as FAILED in DB).", "数据库中超过 24 小时但实际未在执行器运行的执行，通常由执行器重启或崩溃造成。可以安全清理（会在数据库中标记为 FAILED）。")}
            </p>
            </div>
            <div>
              <p className="font-semibold text-info-foreground">
                🔵 Stuck Queued Executions:
              </p>
              <p className="text-foreground-secondary">
                {t("QUEUED >1h but never started. Not in RabbitMQ queue. Can cleanup (safe) or requeue (⚠️ costs credits - only if temporary issue like RabbitMQ purge).", "已 QUEUED 超过 1 小时但从未开始，也不在 RabbitMQ 队列中。可以清理（安全），或重新入队（⚠️ 会消耗额度，仅适用于 RabbitMQ 清空等临时问题）。")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-yellow-foreground">
                🟡 Long-Running Executions:
              </p>
              <p className="text-foreground-secondary">
                {t("RUNNING status >24h. May be legitimately long jobs or stuck. Review before stopping. Sends cancel signal to executor.", "RUNNING 状态超过 24 小时，可能是正常的长任务，也可能已卡住。停止前请先检查；停止会向执行器发送取消信号。")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-error-foreground">
                🔴 Failed Executions:
              </p>
              <p className="text-foreground-secondary">
                {t("Executions that failed in last 24h. View error messages to identify patterns. Spike in failures indicates system issues.", "过去 24 小时内失败的执行。查看错误消息以识别规律；失败数激增通常表示系统存在问题。")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-pink-foreground">
                🩷 Invalid States (Data Corruption):
              </p>
              <p className="text-foreground-secondary">
                {t("Executions in impossible states (QUEUED with startedAt, RUNNING without startedAt). Indicates DB corruption, race conditions, or crashes. Each requires manual investigation - no bulk actions provided.", "执行处于不可能的状态（QUEUED 却有 startedAt，或 RUNNING 却没有 startedAt），表示数据库损坏、竞态条件或崩溃。每条都需要人工调查，不提供批量操作。")}
              </p>
            </div>
            <div>
              <p className="font-semibold">Throughput Metrics:</p>
              <p className="text-foreground-secondary">
                {t("Completions per hour shows system productivity. Declining throughput indicates performance degradation or executor issues.", "每小时完成数反映系统生产力。吞吐量下降表示性能下降或执行器存在问题。")}
              </p>
            </div>
            <div>
              <p className="font-semibold">Queue Health:</p>
              <p className="text-foreground-secondary">
                {t("RabbitMQ depths should be low (<100). High queues indicate executor can't keep up. Cancel queue backlog indicates executor processing issues.", "RabbitMQ 队列深度应保持较低（<100）。队列过高表示执行器处理不过来；取消队列积压表示执行器处理存在问题。")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Executions Table with tab counts */}
      <ExecutionsTable
        onRefresh={refresh}
        initialTab={activeTab}
        onTabChange={setActiveTab}
        diagnosticsData={
          executionData
            ? {
                orphaned_running: executionData.orphaned_running,
                orphaned_queued: executionData.orphaned_queued,
                failed_count_24h: executionData.failed_count_24h,
                stuck_running_24h: executionData.stuck_running_24h,
                stuck_queued_1h: executionData.stuck_queued_1h,
                invalid_queued_with_start:
                  executionData.invalid_queued_with_start,
                invalid_running_without_start:
                  executionData.invalid_running_without_start,
              }
            : undefined
        }
      />

      {/* Add Schedules Table */}
      <SchedulesTable
        onRefresh={refresh}
        diagnosticsData={
          scheduleData
            ? {
                total_orphaned: scheduleData.total_orphaned,
                user_schedules: scheduleData.user_schedules,
              }
            : undefined
        }
      />
    </div>
  );
}
