import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetMyBusinessUnderstandingQueryKey,
  useForgetMyBusinessUnderstanding,
  useGetMyBusinessUnderstanding,
} from "@/app/api/__generated__/endpoints/memory/memory";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getUnderstandingRows } from "./helpers";

export function useUnderstandingCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const query = useGetMyBusinessUnderstanding();
  const rows = getUnderstandingRows(
    query.data?.status === 200 ? query.data.data : undefined,
  );

  const forget = useForgetMyBusinessUnderstanding({
    mutation: {
      onSuccess() {
        setIsConfirmOpen(false);
        queryClient.invalidateQueries({
          queryKey: getGetMyBusinessUnderstandingQueryKey(),
        });
        toast({ title: t("Forgotten", "已忘记") });
      },
      onError() {
        toast({
          title: t("Could not forget this", "无法忘记此项"),
          description: t("Please try again.", "请重试。"),
          variant: "destructive",
        });
      },
    },
  });

  return {
    rows,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConfirmOpen,
    setIsConfirmOpen,
    forget: () => forget.mutate(),
    isForgetting: forget.isPending,
  };
}
