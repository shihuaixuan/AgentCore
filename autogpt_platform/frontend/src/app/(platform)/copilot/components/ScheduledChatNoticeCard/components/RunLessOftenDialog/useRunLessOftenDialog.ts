import { getGetHomeDashboardQueryKey } from "@/app/api/__generated__/endpoints/home/home";
import {
  getGetScheduledChatCadenceQueryKey,
  useGetScheduledChatCadence,
  useSetScheduledChatCadence,
} from "@/app/api/__generated__/endpoints/schedules/schedules";
import { okData } from "@/app/api/helpers";
import { toast } from "@/components/molecules/Toast/use-toast";
import { invalidateAllScheduleQueries } from "@/services/schedules/invalidate-schedules";
import * as Sentry from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { changeErrorText, lowerFirst, refusalText } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Args {
  scheduleKey: string;
  isOpen: boolean;
  onDone: () => void;
}

export function useRunLessOftenDialog({ scheduleKey, isOpen, onDone }: Args) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const cadenceQuery = useGetScheduledChatCadence(scheduleKey, {
    query: { enabled: isOpen, select: (res) => okData(res) },
  });
  const cadence = cadenceQuery.data;

  const { mutate, isPending } = useSetScheduledChatCadence({
    mutation: {
      onSuccess: (res, { data }) => {
        const changed = okData(res);
        // The choice in the owner's words: "Weekdays at 09:00" reads back as
        // that, not as "5 times a week".
        const chosen = cadence?.options.find(
          (option) => option.cron === data.cron,
        );
        queryClient.invalidateQueries({
          queryKey: getGetScheduledChatCadenceQueryKey(scheduleKey),
        });
        queryClient.invalidateQueries({
          queryKey: getGetHomeDashboardQueryKey(),
        });
        void invalidateAllScheduleQueries(queryClient);
        const runs = chosen?.label ?? changed?.current;
        toast({
          title: t("It runs less often now", "已降低运行频率"),
          description:
            changed && runs
              ? t(
                  `“${changed.title}” now runs ${lowerFirst(runs)}.`,
                  `“${changed.title}”的运行计划已改为：${runs}。`,
                )
              : undefined,
        });
        setSelected(null);
        onDone();
      },
      onError: (error) => {
        const known = changeErrorText(error, locale);
        if (known === null) Sentry.captureException(error);
        toast({
          variant: "destructive",
          title: t("Couldn't change how often it runs", "无法更改运行频率"),
          description: known ?? t("Please try again.", "请重试。"),
        });
      },
    },
  });

  function save() {
    if (!selected || isPending) return;
    mutate({ scheduleKey, data: { cron: selected } });
  }

  return {
    cadence,
    isLoading: cadenceQuery.isLoading,
    refusal: refusalText(cadenceQuery.error, locale),
    isError: cadenceQuery.isError,
    selected,
    select: setSelected,
    save,
    isSaving: isPending,
  };
}
