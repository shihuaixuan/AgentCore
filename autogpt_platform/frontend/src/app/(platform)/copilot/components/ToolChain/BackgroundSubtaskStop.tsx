"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  getGetV2GetSessionQueryKey,
  usePostV2CancelSessionTask,
} from "@/app/api/__generated__/endpoints/chat/chat";
import { Button } from "@/components/atoms/Button/Button";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  sessionId: string;
}

export function BackgroundSubtaskStop({ sessionId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutate, isPending } = usePostV2CancelSessionTask({
    mutation: {
      onSuccess: (response) => {
        if (response.status !== 200 || !response.data.cancelled)
          showStopError();
        return queryClient.invalidateQueries({
          queryKey: getGetV2GetSessionQueryKey(sessionId),
        });
      },
      onError: showStopError,
    },
  });

  function stop() {
    mutate({ sessionId });
  }

  function showStopError() {
    toast({
      title: t("Could not stop subtask", "无法停止子任务"),
      description: t("Please try again.", "请重试。"),
      variant: "destructive",
    });
  }

  return (
    <Button
      variant="ghost"
      size="small"
      disabled={isPending}
      onClick={stop}
      aria-label={t("Stop background subtask", "停止后台子任务")}
    >
      {isPending ? t("Stopping…", "正在停止…") : t("Stop", "停止")}
    </Button>
  );
}
