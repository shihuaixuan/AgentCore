"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getGetV1ListGraphExecutionsQueryKey } from "@/app/api/__generated__/endpoints/graphs/graphs";
import { usePatchV1UpdateExecutionSchedule } from "@/app/api/__generated__/endpoints/schedules/schedules";
import type { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { safeHumanizeCronExpression } from "@/lib/cron-expression-utils";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { validateSchedule } from "../../../../modals/ScheduleAgentModal/components/ModalScheduleSection/helpers";
import {
  buildCron,
  DAY_ITEMS,
  type EditScheduleForm,
  formFromSchedule,
  REPEAT_OPTIONS,
} from "./helpers";

interface FormErrors {
  scheduleName?: string;
  time?: string;
  days?: string;
}

export function useEditScheduleModal(
  graphId: string,
  schedule: GraphExecutionJobInfo,
) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() => formFromSchedule(schedule));
  const [errors, setErrors] = useState<FormErrors>({});

  function update(fields: Partial<EditScheduleForm>) {
    setForm((current) => ({ ...current, ...fields }));
  }

  // The dialog stays mounted while the selected schedule changes, so the form
  // reloads from whichever schedule is current each time it opens.
  function handleOpenChange(open: boolean) {
    if (open) {
      setForm(formFromSchedule(schedule));
      setErrors({});
    }
    setIsOpen(open);
  }

  const { mutate: updateSchedule, isPending } =
    usePatchV1UpdateExecutionSchedule({
      mutation: {
        onSuccess: async () => {
          invalidateAllScheduleQueries(queryClient, graphId);
          const runsKey = getGetV1ListGraphExecutionsQueryKey(graphId);
          await queryClient.invalidateQueries({ queryKey: runsKey });
          setIsOpen(false);
        },
        onError: (error) => {
          toast({
            title: t("Failed to update schedule", "无法更新计划"),
            description:
              error instanceof Error
                ? error.message
                : t("An unexpected error occurred.", "发生意外错误。"),
            variant: "destructive",
          });
        },
      },
    });

  function handleSave() {
    const errorsNow: FormErrors = validateSchedule(
      {
        scheduleName: form.name,
        time: form.canEditTiming ? form.time : undefined,
      },
      t,
    );
    if (
      form.canEditTiming &&
      form.repeat === "weekly" &&
      form.selectedDays.length === 0
    ) {
      errorsNow.days = t("Pick at least one day", "请至少选择一天");
    }
    setErrors(errorsNow);
    if (Object.keys(errorsNow).length > 0) return;
    updateSchedule({
      scheduleId: schedule.id,
      data: form.canEditTiming
        ? { name: form.name, cron: buildCron(form) }
        : { name: form.name },
    });
  }

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    name: form.name,
    setName: (name: string) => update({ name }),
    canEditTiming: form.canEditTiming,
    recurrenceLabel: safeHumanizeCronExpression(schedule.cron, locale),
    repeat: form.repeat,
    setRepeat: (repeat: string) => update({ repeat }),
    selectedDays: form.selectedDays,
    setSelectedDays: (selectedDays: string[]) => update({ selectedDays }),
    time: form.time,
    setTime: (time: string) => update({ time }),
    errors,
    repeatOptions: REPEAT_OPTIONS.map((option) => ({
      ...option,
      label: t(option.label, option.value === "daily" ? "每天" : "每周"),
    })),
    dayItems: DAY_ITEMS.map((day) => ({
      ...day,
      label: t(
        day.label,
        ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
          Number(day.value)
        ],
      ),
    })),
    handleSave,
    isPending,
  };
}
