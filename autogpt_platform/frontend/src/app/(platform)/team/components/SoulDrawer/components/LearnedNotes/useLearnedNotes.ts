import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getListMyExpertMemoryFactsQueryKey,
  useForgetMyExpertMemoryFact,
  useListMyExpertMemoryFacts,
} from "@/app/api/__generated__/endpoints/memory/memory";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/** Enough to show what the expert is picking up without crowding out the Soul
 *  fields above it; the rest is one click away on the memory page. */
const SOUL_NOTES_LIMIT = 5;

export function useLearnedNotes(expertId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const factsQuery = useListMyExpertMemoryFacts(expertId, {
    limit: SOUL_NOTES_LIMIT,
  });
  const facts =
    factsQuery.data?.status === 200 ? factsQuery.data.data.items : [];

  const forgetFact = useForgetMyExpertMemoryFact({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListMyExpertMemoryFactsQueryKey(expertId),
        });
        toast({ title: t("Forgotten", "已忘记") });
      },
      onError: () => {
        toast({
          title: t("Could not forget that memory", "无法忘记该记忆"),
          description: t("Please try again.", "请重试。"),
          variant: "destructive",
        });
      },
    },
  });

  async function forget(uuid: string) {
    try {
      await forgetFact.mutateAsync({ expertId, factUuid: uuid });
    } catch {
      // onError already surfaced the toast; keep the rejection out of the
      // click handler.
    }
  }

  return {
    facts,
    isLoading: factsQuery.isLoading,
    isError: factsQuery.isError,
    forget,
    forgettingUuid: forgetFact.isPending
      ? (forgetFact.variables?.factUuid ?? null)
      : null,
  };
}
