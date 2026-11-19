"use client";

import type { SubscriptionTier } from "@/app/api/__generated__/models/subscriptionTier";
import {
  getGetV2GetUserRateLimitQueryKey,
  useGetV2GetUserRateLimit,
  usePostV2ResetUserRateLimitUsage,
  usePostV2SetUserRateLimitTier,
} from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, getPlanName } from "../../helpers";
import type { ResetScope } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useAutoPilotUsage(userId: string) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rateLimit = useGetV2GetUserRateLimit(
    { user_id: userId },
    { query: { select: okData } },
  );

  const setTier = usePostV2SetUserRateLimitTier({
    mutation: {
      onSuccess: (response, { data }) => {
        const planName = getPlanName(data.tier);
        const warning = okData(response)?.warning;
        toast(
          warning
            ? {
                title: t(
                  `Plan set to ${planName}, but Stripe will revert it`,
                  `套餐已设为 ${planName}，但 Stripe 会将其还原`,
                ),
                description: warning,
                variant: "destructive",
              }
            : {
                title: t(`Plan set to ${planName}`, `套餐已设为 ${planName}`),
                variant: "success",
              },
        );
        void queryClient.invalidateQueries({
          queryKey: getUsageQueryKey(data.user_id),
        });
      },
      onError: (error) => {
        toast({
          title: t("Couldn't change the plan", "无法更改套餐"),
          description: getErrorMessage(error, locale),
          variant: "destructive",
        });
      },
    },
  });

  const reset = usePostV2ResetUserRateLimitUsage({
    mutation: {
      onSuccess: (response, { data }) => {
        queryClient.setQueryData(getUsageQueryKey(data.user_id), response);
        toast({
          title: data.reset_weekly
            ? t("Daily and weekly usage reset", "每日和每周用量已重置")
            : t("Daily usage reset", "每日用量已重置"),
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: t("Couldn't reset usage", "无法重置用量"),
          description: getErrorMessage(error, locale),
          variant: "destructive",
        });
      },
    },
  });

  function changePlan(tier: string, onSuccess: () => void) {
    setTier.mutate(
      {
        data: { user_id: userId, tier: tier as SubscriptionTier },
      },
      { onSuccess },
    );
  }

  function resetUsage(scope: ResetScope, onSuccess: () => void) {
    reset.mutate(
      { data: { user_id: userId, reset_weekly: scope === "both" } },
      { onSuccess },
    );
  }

  return {
    rateLimit: rateLimit.data,
    isLoading: rateLimit.isLoading,
    error: rateLimit.error,
    refetch: rateLimit.refetch,
    changePlan,
    isChangingPlan: setTier.isPending,
    resetUsage,
    isResetting: reset.isPending,
  };
}

// Keyed by the user a request was sent for, never the one now on screen: the
// section stays mounted across lookups, and React Query hands a pending
// mutation the latest render's callbacks.
function getUsageQueryKey(userID: string) {
  return getGetV2GetUserRateLimitQueryKey({ user_id: userID });
}
