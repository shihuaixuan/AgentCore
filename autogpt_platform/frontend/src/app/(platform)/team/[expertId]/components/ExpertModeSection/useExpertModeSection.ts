import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetExpertQueryKey,
  getListExpertIdentitiesQueryKey,
  getListExpertsQueryKey,
  useUpdateExpertMode,
} from "@/app/api/__generated__/endpoints/experts/experts";
import { Expert } from "@/app/api/__generated__/models/expert";
import {
  type AutopilotMode,
  DEFAULT_AUTOPILOT_MODE,
} from "@/app/(platform)/copilot/autopilotModeStore";
import { toast } from "@/components/molecules/Toast/use-toast";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Args {
  expert: Expert;
}

export function useExpertModeSection({ expert }: Args) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const mode: AutopilotMode = expert.autopilot_mode ?? DEFAULT_AUTOPILOT_MODE;

  const { mutate, isPending } = useUpdateExpertMode({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getGetExpertQueryKey(expert.id),
          }),
          queryClient.invalidateQueries({ queryKey: getListExpertsQueryKey() }),
          queryClient.invalidateQueries({
            queryKey: getListExpertIdentitiesQueryKey(),
          }),
        ]);
        toast({ title: t("Approval mode updated", "审批模式已更新") });
      },
      onError: (error) => {
        const isDisabled = error instanceof ApiError && error.status === 403;
        toast({
          title: isDisabled
            ? t(
                "Approval modes are not enabled for your account",
                "你的账户尚未启用审批模式",
              )
            : t("Could not update the approval mode", "无法更新审批模式"),
          description: isDisabled
            ? undefined
            : t("Please try again.", "请重试。"),
          variant: "destructive",
        });
      },
    },
  });

  function save(value: AutopilotMode) {
    mutate({ expertId: expert.id, data: { autopilot_mode: value } });
  }

  function selectMode(value: AutopilotMode) {
    if (value === mode || isPending) return;
    if (value === "unsupervised") {
      setIsConfirmOpen(true);
      return;
    }
    save(value);
  }

  function confirmUnsupervised() {
    setIsConfirmOpen(false);
    save("unsupervised");
  }

  function cancelUnsupervised() {
    setIsConfirmOpen(false);
  }

  return {
    mode,
    isPending,
    selectMode,
    isConfirmOpen,
    confirmUnsupervised,
    cancelUnsupervised,
  };
}
