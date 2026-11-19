import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { usePostV1CreateExecutionSchedule as useCreateSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

interface UseScheduleAgentModalCallbacks {
  onCreateSchedule?: (schedule: GraphExecutionJobInfo) => void;
  onClose?: () => void;
}

export function useScheduleAgentModal(
  agent: LibraryAgent,
  inputValues: Record<string, any>,
  inputCredentials: Record<string, any>,
  callbacks?: UseScheduleAgentModalCallbacks,
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultScheduleName = useMemo(
    () => t(`Run ${agent.name}`, `运行 ${agent.name}`),
    [agent.name, t],
  );
  const [scheduleName, setScheduleName] = useState(defaultScheduleName);
  const [cronExpression, setCronExpression] = useState(
    agent.recommended_schedule_cron || "0 9 * * 1",
  );

  const createScheduleMutation = useCreateSchedule({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          toast({
            title: t("Schedule created", "计划已创建"),
          });
          callbacks?.onCreateSchedule?.(response.data);
          invalidateAllScheduleQueries(queryClient, agent.graph_id);
          // Reset form
          setScheduleName(defaultScheduleName);
          setCronExpression(agent.recommended_schedule_cron || "0 9 * * 1");
          callbacks?.onClose?.();
        }
      },
      onError: (error: any) => {
        toast({
          title: t("❌ Failed to create schedule", "❌ 无法创建计划"),
          description:
            error.message ||
            t("An unexpected error occurred.", "发生意外错误。"),
          variant: "destructive",
        });
      },
    },
  });

  const handleSchedule = useCallback(
    (scheduleName: string, cronExpression: string) => {
      if (!scheduleName.trim()) {
        toast({
          title: t("⚠️ Schedule name required", "⚠️ 请填写计划名称"),
          description: t(
            "Please provide a name for your schedule.",
            "请填写计划名称。",
          ),
          variant: "destructive",
        });
        return Promise.reject(
          new Error(t("Schedule name required", "请填写计划名称")),
        );
      }

      return new Promise<void>((resolve, reject) => {
        createScheduleMutation.mutate(
          {
            graphId: agent.graph_id,
            data: {
              name: scheduleName,
              cron: cronExpression,
              inputs: inputValues,
              graph_version: agent.graph_version,
              credentials: inputCredentials,
            },
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          },
        );
      });
    },
    [
      agent.graph_id,
      agent.graph_version,
      inputValues,
      inputCredentials,
      createScheduleMutation,
      toast,
      t,
    ],
  );

  const handleSetScheduleName = useCallback((name: string) => {
    setScheduleName(name);
  }, []);

  const handleSetCronExpression = useCallback((expression: string) => {
    setCronExpression(expression);
  }, []);

  const resetForm = useCallback(() => {
    setScheduleName(defaultScheduleName);
    setCronExpression(agent.recommended_schedule_cron || "0 9 * * 1");
  }, [defaultScheduleName, agent.recommended_schedule_cron]);

  return {
    // State
    scheduleName,
    cronExpression,

    // Loading state
    isCreatingSchedule: createScheduleMutation.isPending,

    // Actions
    handleSchedule,
    handleSetScheduleName,
    handleSetCronExpression,
    resetForm,
  };
}
