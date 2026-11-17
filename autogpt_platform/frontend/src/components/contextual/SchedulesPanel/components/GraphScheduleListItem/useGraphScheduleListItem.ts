"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useDeleteV1DeleteExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { describeCron } from "@/components/contextual/CronScheduler/helpers";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";

interface Args {
  schedule: GraphExecutionJobInfo;
}

export function useGraphScheduleListItem({ schedule }: Args) {
  const { t, locale } = useTranslation();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeleteV1DeleteExecutionSchedule();

  const nextRunDate = schedule.next_run_time
    ? new Date(schedule.next_run_time)
    : null;
  const nextRunRelative =
    nextRunDate && !Number.isNaN(nextRunDate.valueOf())
      ? formatDistanceToNow(nextRunDate, {
          addSuffix: true,
          locale: locale === "zh-CN" ? zhCN : undefined,
        })
      : null;
  // One source of truth: the row prefixes it, the View dialog shows it bare.
  const nextRunValue = nextRunRelative
    ? nextRunRelative
    : schedule.next_run_time
      ? t("Pending", "等待中")
      : t("Paused", "已暂停");
  const nextRunLabel = nextRunRelative
    ? t(`Next ${nextRunRelative}`, `下次：${nextRunRelative}`)
    : nextRunValue;
  const nextRunTitle = nextRunDate ? nextRunDate.toString() : undefined;

  const recurrenceLabel = schedule.cron
    ? describeCron(schedule.cron, t)
    : t("Runs once", "仅运行一次");

  const agentLabel =
    schedule.agent_name ||
    schedule.name ||
    t("Scheduled workflow", "定时工作流");
  const agentHref = `/build?flowID=${schedule.graph_id}&flowVersion=${schedule.graph_version}`;

  function openDelete() {
    setIsDeleteOpen(true);
  }
  function closeDelete(open: boolean) {
    setIsDeleteOpen(open);
  }
  function openView() {
    setIsViewOpen(true);
  }
  function closeView(open: boolean) {
    setIsViewOpen(open);
  }

  async function handleDelete() {
    try {
      await deleteSchedule({ scheduleId: schedule.id });
      toast({ title: t("Schedule deleted", "计划已删除") });
      setIsDeleteOpen(false);
      invalidateAllScheduleQueries(queryClient, schedule.graph_id);
    } catch (error) {
      toast({
        title: t("Failed to delete schedule", "删除计划失败"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  return {
    nextRunLabel,
    nextRunValue,
    nextRunTitle,
    recurrenceLabel,
    agentLabel,
    agentHref,
    isDeleteOpen,
    openDelete,
    closeDelete,
    isDeleting,
    handleDelete,
    isViewOpen,
    openView,
    closeView,
  };
}
