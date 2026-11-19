import {
  getGetV2AdminListPendingSkillSubmissionsQueryKey,
  useGetV2AdminListPendingSkillSubmissions,
  usePostV2ReviewSkillSubmission,
} from "@/app/api/__generated__/endpoints/admin/admin";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useAdminSkillSubmissions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useGetV2AdminListPendingSkillSubmissions();

  const { mutate: review, isPending } = usePostV2ReviewSkillSubmission({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: getGetV2AdminListPendingSkillSubmissionsQueryKey(),
        }),
      onError: (error) =>
        toast({
          title: t("Couldn't record that review", "无法保存审核结果"),
          description:
            error instanceof Error
              ? error.message
              : t("Please try again.", "请重试。"),
          variant: "destructive",
        }),
    },
  });

  function submitReview(versionId: string, isApproved: boolean) {
    review({
      skillListingVersionId: versionId,
      data: {
        is_approved: isApproved,
        comments: isApproved ? "Approved" : "Rejected",
      },
    });
  }

  const loaded = query.data?.status === 200 ? query.data.data : null;

  return {
    submissions: loaded ?? [],
    isLoading: query.isLoading,
    isUnavailable: !query.isLoading && loaded === null,
    isReviewing: isPending,
    approve: (versionId: string) => submitReview(versionId, true),
    reject: (versionId: string) => submitReview(versionId, false),
  };
}
