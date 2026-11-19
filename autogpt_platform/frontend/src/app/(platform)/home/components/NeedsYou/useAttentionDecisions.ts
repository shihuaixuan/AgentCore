import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getGetHomeDashboardQueryKey } from "@/app/api/__generated__/endpoints/home/home";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useProcessReviews } from "@/hooks/useProcessReviews";
import { trackFunnel } from "@/services/experts/experts-analytics";

export function useAttentionDecisions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { processReviews } = useProcessReviews();
  const { toast } = useToast();
  const [pendingIDs, setPendingIDs] = useState<Set<string>>(new Set());

  function setPending(itemID: string, pending: boolean) {
    setPendingIDs((current) => {
      const next = new Set(current);
      if (pending) next.add(itemID);
      else next.delete(itemID);
      return next;
    });
  }

  async function decide(item: HomeAttentionItem, approved: boolean) {
    if (!item.review) return;
    setPending(item.id, true);
    try {
      const response = await processReviews(
        [
          {
            node_exec_id: item.review.node_exec_id,
            approved,
            auto_approve_future: false,
          },
        ],
        [item.review],
      );
      if (response.status !== 200 || response.data.failed_count > 0) {
        const message = response.status === 200 ? response.data.error : null;
        throw new Error(
          message ||
            t("The review could not be processed.", "无法处理此审核。"),
        );
      }
      trackFunnel("home_attention_actioned", {
        kind: item.kind,
        action: approved ? "approve" : "decline",
      });
      toast({
        title: approved ? t("Approved", "已批准") : t("Declined", "已拒绝"),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetHomeDashboardQueryKey(),
      });
    } catch (error) {
      toast({
        title: approved
          ? t("Could not approve", "无法批准")
          : t("Could not decline", "无法拒绝"),
        description:
          error instanceof Error ? error.message : t("Try again.", "请重试。"),
        variant: "destructive",
      });
    } finally {
      setPending(item.id, false);
    }
  }

  return { pendingIDs, decide };
}
