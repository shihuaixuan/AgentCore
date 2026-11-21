import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getGraphErrorMessage } from "../../../../helpers/graphErrorMessage";
import type { ScheduleCreationRequest } from "@/app/api/__generated__/models/scheduleCreationRequest";
import { usePostV1CreateExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { getTimezoneDisplayName } from "@/lib/timezone-utils";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";

export function useCronSchedulerDialog({
  open,
  setOpen,
  inputs,
  credentials,
  defaultCronExpression = "",
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputs: ScheduleCreationRequest["inputs"];
  credentials: ScheduleCreationRequest["credentials"];
  defaultCronExpression?: string;
}) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cronExpression, setCronExpression] = useState<string>("");
  const [scheduleName, setScheduleName] = useState<string>("");
  const [nameMissing, setNameMissing] = useState(false);

  const [{ flowID, flowVersion }] = useQueryStates({
    flowID: parseAsString,
    flowVersion: parseAsInteger,
    flowExecutionID: parseAsString,
  });

  const userTimezone = useUserTimezone();
  const timezoneDisplay = getTimezoneDisplayName(userTimezone || "UTC", locale);

  const { mutateAsync: createSchedule, isPending: isCreatingSchedule } =
    usePostV1CreateExecutionSchedule({
      mutation: {
        onSuccess: (response) => {
          if (response.status === 200) {
            setOpen(false);
            toast({
              title: t("Schedule created", "计划已创建"),
              description: t("Schedule created successfully", "已成功创建计划"),
            });
            invalidateAllScheduleQueries(queryClient, flowID ?? undefined);
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("Failed to create schedule", "创建计划失败"),
            description: getGraphErrorMessage(error, t),
          });
        },
      },
    });

  useEffect(() => {
    if (open) {
      setCronExpression(defaultCronExpression);
    }
  }, [open, defaultCronExpression]);

  useEffect(() => {
    if (open) {
      setScheduleName("");
      setNameMissing(false);
    }
  }, [open]);

  function handleScheduleNameChange(name: string) {
    setScheduleName(name);
    if (name.trim() !== "") {
      setNameMissing(false);
    }
  }

  async function handleCreateSchedule() {
    if (!scheduleName || scheduleName.trim() === "") {
      setNameMissing(true);
      toast({
        variant: "destructive",
        title: t("Invalid schedule", "计划无效"),
        description: t("Please enter a schedule name", "请输入计划名称"),
      });
      return;
    }

    if (!cronExpression || cronExpression.trim() === "") {
      toast({
        variant: "destructive",
        title: t("Invalid schedule", "计划无效"),
        description: t(
          "Please enter a valid cron expression",
          "请输入有效的 cron 表达式",
        ),
      });
      return;
    }

    await createSchedule({
      graphId: flowID || "",
      data: {
        name: scheduleName.trim(),
        graph_version: flowID ? flowVersion : undefined,
        cron: cronExpression,
        inputs: inputs,
        credentials: credentials,
      },
    });
  }

  return {
    cronExpression,
    setCronExpression,
    userTimezone,
    timezoneDisplay,
    handleCreateSchedule,
    setScheduleName: handleScheduleNameChange,
    scheduleName,
    scheduleNameError: nameMissing
      ? t("Schedule name is required", "请填写计划名称")
      : "",
    isCreatingSchedule,
  };
}
