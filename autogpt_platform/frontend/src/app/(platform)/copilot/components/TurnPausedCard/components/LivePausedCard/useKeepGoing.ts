"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getGetV2GetCopilotUsageQueryKey,
  usePostV2ContinueSession,
} from "@/app/api/__generated__/endpoints/chat/chat";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useManagedChatModels } from "../../../../useManagedChatModels";
import { useCopilotUIStore } from "../../../../store";
import { continueOutcome } from "./helpers";

interface Args {
  sessionId: string;
  /** Attach to the turn the server started. */
  onFollow: () => void;
  /** The account ran out of budget since the pause; when it next resets. */
  onOutOfBudget: (resetsAt: string | null) => void;
}

export function useKeepGoing({ sessionId, onFollow, onOutOfBudget }: Args) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  // The composer's model choice, as a message sent now would carry it.
  const { modelID } = useManagedChatModels();
  const legacyTier = useCopilotUIStore((state) => state.copilotLlmModel);
  const { mutateAsync, isPending } = usePostV2ContinueSession();

  async function keepGoing() {
    try {
      await mutateAsync({
        sessionId,
        data: modelID ? { managed_model_id: modelID } : { model: legacyTier },
      });
      onFollow();
    } catch (error) {
      const outcome = continueOutcome(error, locale);
      if (outcome.kind === "running") {
        onFollow();
        return;
      }
      if (outcome.kind === "out_of_budget") {
        void queryClient.invalidateQueries({
          queryKey: getGetV2GetCopilotUsageQueryKey(),
        });
        onOutOfBudget(outcome.resetsAt);
        return;
      }
      toast({
        title: t("Couldn't pick this back up", "无法恢复此任务"),
        description: outcome.description,
        variant: "destructive",
      });
    }
  }

  return { keepGoing, isContinuing: isPending };
}
