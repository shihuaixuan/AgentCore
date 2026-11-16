"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  getGetV2GetSessionQueryKey,
  usePostV2CancelSessionTask,
} from "@/app/api/__generated__/endpoints/chat/chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { toast } from "@/components/molecules/Toast/use-toast";
import * as Sentry from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { CancelCircleIcon, HourglassIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  sessionID: string | null;
}

const QUEUED_TOOLTIP =
  "Will start automatically when one of your current tasks finishes.";

export function QueueBadge({ sessionID }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutate: cancelTask, isPending: isCancelling } =
    usePostV2CancelSessionTask({
      mutation: {
        onSuccess: () => {
          if (sessionID) {
            queryClient.invalidateQueries({
              queryKey: getGetV2GetSessionQueryKey(sessionID),
            });
          }
        },
        onError: (error) => {
          // 404 = session not found / not owned: sync the UI and
          // suppress the destructive toast.
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status === 404) {
            if (sessionID) {
              queryClient.invalidateQueries({
                queryKey: getGetV2GetSessionQueryKey(sessionID),
              });
            }
            return;
          }
          Sentry.captureException(error);
          toast({
            variant: "destructive",
            title: t("Could not cancel queued task", "无法取消排队任务"),
            description: t("Please try again.", "请重试。"),
          });
        },
      },
    });

  function handleCancel() {
    if (!sessionID || isCancelling) return;
    cancelTask({ sessionId: sessionID });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-accent-surface px-2 py-0.5 text-caption-sm leading-inherit font-medium text-accent-strong"
            data-testid="queue-badge-queued"
          >
            <Icon icon={HourglassIcon} size={12} />
            {t("Queued", "排队中")}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs whitespace-normal">
          {t(QUEUED_TOOLTIP, "当前任务之一完成后将自动开始。")}
        </TooltipContent>
      </Tooltip>
      {sessionID ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              aria-label={t("Cancel queued task", "取消排队任务")}
              data-testid="queue-cancel-button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-foreground-tertiary transition-colors hover:text-error-foreground disabled:opacity-50"
            >
              <Icon icon={CancelCircleIcon} size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {t("Cancel queued task", "取消排队任务")}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
