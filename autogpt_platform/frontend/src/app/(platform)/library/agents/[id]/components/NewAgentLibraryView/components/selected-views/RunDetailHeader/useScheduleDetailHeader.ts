"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useDeleteV1DeleteExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";

export function useScheduleDetailHeader(
  agentGraphId: string,
  scheduleId?: string,
  agentGraphVersion?: number | string,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useDeleteV1DeleteExecutionSchedule({
    mutation: {
      onSuccess: () => {
        toast({ title: t("Schedule deleted", "计划已删除") });
        invalidateAllScheduleQueries(queryClient, agentGraphId);
      },
      onError: (error: any) =>
        toast({
          title: "Failed to delete schedule",
          description: error?.message || "An unexpected error occurred.",
          variant: "destructive",
        }),
    },
  });

  function deleteSchedule() {
    if (!scheduleId) return;
    deleteMutation.mutate({ scheduleId });
  }

  const openInBuilderHref = `/build?flowID=${agentGraphId}&flowVersion=${agentGraphVersion}`;

  return {
    deleteSchedule,
    isDeleting: deleteMutation.isPending,
    openInBuilderHref,
  } as const;
}
