"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getGetV2ListTurnsAtBudgetResetQueryKey,
  useDeleteV2CancelTurnAtBudgetReset,
  useGetV2ListTurnsAtBudgetReset,
  usePostV2ScheduleTurnAtBudgetReset,
} from "@/app/api/__generated__/endpoints/chat/chat";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { atResetOutcome } from "./helpers";
import { useManagedChatModels } from "../../../../useManagedChatModels";

interface Args {
  sessionId: string;
  enabled: boolean;
  /** The budget refilled already, so there is nothing to wait for. */
  onBudgetBack: () => void;
}

export function useResumeAtReset({ sessionId, enabled, onBudgetBack }: Args) {
  const { modelID } = useManagedChatModels();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const jobs = useGetV2ListTurnsAtBudgetReset(sessionId, {
    query: {
      enabled,
      select: (response) => (response.status === 200 ? response.data.jobs : []),
    },
  });
  // Settles once the list shows the change, so the card never flashes the
  // state it just left.
  const refresh = {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getGetV2ListTurnsAtBudgetResetQueryKey(sessionId),
      }),
  };
  const schedule = usePostV2ScheduleTurnAtBudgetReset({ mutation: refresh });
  const cancel = useDeleteV2CancelTurnAtBudgetReset({ mutation: refresh });
  const resume = jobs.data?.find((job) => job.kind === "resume");

  async function resumeAtReset() {
    try {
      await schedule.mutateAsync({
        sessionId,
        data: {
          kind: "resume",
          message: null,
          ...(modelID ? { managed_model_id: modelID } : {}),
        },
      });
    } catch (error) {
      const outcome = atResetOutcome(error, locale);
      if (outcome.kind === "budget_back") {
        onBudgetBack();
        return;
      }
      toast({
        title: outcome.title,
        description: outcome.description,
        variant: "destructive",
      });
    }
  }

  async function cancelResume() {
    try {
      await cancel.mutateAsync({ sessionId, kind: "resume" });
    } catch {
      toast({
        title: t("Couldn't cancel the resume", "无法取消恢复任务"),
        description: t("Try again in a moment.", "请稍后重试。"),
        variant: "destructive",
      });
    }
  }

  return {
    resumesAt: resume ? new Date(resume.run_at) : null,
    resumeAtReset,
    cancelResume,
    isScheduling: schedule.isPending,
    isCancelling: cancel.isPending,
  };
}
