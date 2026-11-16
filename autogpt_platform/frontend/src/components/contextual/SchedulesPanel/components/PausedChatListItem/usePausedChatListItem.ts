"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getGetHomeDashboardQueryKey } from "@/app/api/__generated__/endpoints/home/home";
import {
  getListPausedScheduledChatsQueryKey,
  useDeleteV1DeleteExecutionSchedule,
  useResumeScheduledChat,
} from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { PausedScheduledChat } from "@/app/api/__generated__/models/pausedScheduledChat";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import * as Sentry from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Args {
  paused: PausedScheduledChat;
}

export function usePausedChatListItem({ paused }: Args) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({
      queryKey: getListPausedScheduledChatsQueryKey(),
    });
    // Home lists each paused chat under Needs you.
    queryClient.invalidateQueries({ queryKey: getGetHomeDashboardQueryKey() });
    return invalidateAllScheduleQueries(queryClient);
  }

  const { mutate, isPending } = useResumeScheduledChat({
    mutation: {
      onSuccess: () => {
        void refresh();
        toast({
          title: t("Resumed", "已恢复"),
          description: t(
            `“${paused.title}” runs again at its next scheduled time.`,
            `“${paused.title}”将在下次计划时间再次运行。`,
          ),
        });
      },
      onError: (error) => {
        void refresh();
        // Resumed elsewhere already: the refresh drops the row.
        if (error instanceof ApiError && error.status === 404) return;
        Sentry.captureException(error);
        toast({
          variant: "destructive",
          title: t("Couldn't resume this scheduled chat", "无法恢复此定时聊天"),
          description: t("Please try again.", "请重试。"),
        });
      },
    },
  });

  function handleDeleted() {
    setIsDeleteOpen(false);
    void refresh();
    toast({ title: t("Scheduled chat deleted", "定时聊天已删除") });
  }

  const { mutate: deleteSchedule, isPending: isDeleting } =
    useDeleteV1DeleteExecutionSchedule({
      mutation: {
        onSuccess: handleDeleted,
        onError: (error) => {
          // Its schedule was gone already; the delete still cleared the row.
          if (error instanceof ApiError && error.status === 404) {
            handleDeleted();
            return;
          }
          void refresh();
          Sentry.captureException(error);
          toast({
            variant: "destructive",
            title: t(
              "Couldn't delete this scheduled chat",
              "无法删除此定时聊天",
            ),
            description: t("Please try again.", "请重试。"),
          });
        },
      },
    });

  const sessionHref = paused.session_id
    ? `/copilot?sessionId=${encodeURIComponent(paused.session_id)}`
    : null;

  function handleResume() {
    if (isPending) return;
    mutate({ scheduleKey: paused.schedule_key });
  }

  function handleDelete() {
    if (isDeleting) return;
    deleteSchedule({ scheduleId: paused.schedule_key });
  }

  return {
    sessionHref,
    handleResume,
    isResuming: isPending,
    canDelete: !paused.routine,
    isDeleteOpen,
    setIsDeleteOpen,
    handleDelete,
    isDeleting,
  };
}
