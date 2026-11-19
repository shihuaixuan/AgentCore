"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useDeleteV1DeleteExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { CopilotTurnJobInfo } from "@/app/api/__generated__/models/copilotTurnJobInfo";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { describeCron } from "@/components/contextual/CronScheduler/helpers";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";
import { describeFollowup, formatNextRunTitle } from "./helpers";

interface Args {
  followup: CopilotTurnJobInfo;
}

export function useFollowupListItem({ followup }: Args) {
  const { t, locale } = useTranslation();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeleteV1DeleteExecutionSchedule();

  const { messagePreview, sessionHref } = describeFollowup(followup, t);

  const nextRunDate = followup.next_run_time
    ? new Date(followup.next_run_time)
    : null;
  const nextRunLabel =
    nextRunDate && !Number.isNaN(nextRunDate.valueOf())
      ? t(
          `Next ${formatDistanceToNow(nextRunDate, { addSuffix: true })}`,
          `下次：${formatDistanceToNow(nextRunDate, { addSuffix: true, locale: zhCN })}`,
        )
      : t("Pending", "等待中");
  const nextRunTitle = formatNextRunTitle(
    followup.next_run_time,
    followup.user_timezone ?? followup.timezone,
    t,
  );

  const recurrenceLabel = followup.cron
    ? describeCron(followup.cron, locale)
    : t("Runs once", "仅运行一次");

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
      await deleteSchedule({ scheduleId: followup.id });
      toast({ title: t("Follow-up deleted", "跟进已删除") });
      setIsDeleteOpen(false);
      invalidateAllScheduleQueries(queryClient);
    } catch (error) {
      toast({
        title: t("Failed to delete follow-up", "删除跟进失败"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  return {
    sessionHref,
    messagePreview,
    nextRunLabel,
    nextRunTitle,
    recurrenceLabel,
    isDeleteOpen,
    openDelete,
    closeDelete,
    isDeleting,
    handleDelete,
    isViewOpen,
    openView,
    closeView,
    fullMessage: followup.message || t("(no message)", "（无消息）"),
  };
}
