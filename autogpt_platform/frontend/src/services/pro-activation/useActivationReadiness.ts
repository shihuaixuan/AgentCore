import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ActivationResponse } from "@/app/api/__generated__/models/activationResponse";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";
import { refreshActivation } from "./refreshActivation";
import { isCheckoutReturn, safeReturnTo } from "./helpers";
import { storeConsent } from "./storage";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useActivationReadiness(
  userID: string | undefined,
  setOpen: (open: boolean) => void,
  setError: (error: string) => void,
) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const router = useRouter();
  const [readyPlan, setReadyPlan] = useState<"PRO" | "MAX" | null>(null);
  const [isReady, setReady] = useState(false);
  const [hasFreshUsage, setFreshUsage] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const finishing = useRef(false);
  async function finish(response: ActivationResponse, notify: boolean) {
    if (!userID || finishing.current) return;
    finishing.current = true;
    setRefreshing(true);
    try {
      const plan = await refreshActivation(
        client,
        userID,
        response.terms?.plan,
      );
      if (useAuthStore.getState().user?.id !== userID) return;
      if (notify) {
        setReady(true);
        setReadyPlan(plan);
        setFreshUsage(
          response.usage_reset === true && !!response.activation_id,
        );
      }
      storeConsent(userID, null);
      if (notify) {
        setOpen(true);
        const returnTo = safeReturnTo(
          response.return_to ?? "/settings/billing",
        );
        // A Checkout's success URL is where Stripe returns the user; opening it
        // again re-runs that page's checkout-return handling.
        if (
          !isCheckoutReturn(
            new URL(returnTo, window.location.origin).searchParams,
          ) &&
          returnTo !==
            `${window.location.pathname}${window.location.search}${window.location.hash}`
        )
          router.replace(returnTo);
      }
    } catch {
      finishing.current = false;
      if (useAuthStore.getState().user?.id === userID) {
        setOpen(true);
        setError(
          t(
            "Your payment is confirmed. We’re refreshing your plan and usage before you continue.",
            "付款已确认。正在刷新套餐和使用额度，完成后即可继续。",
          ),
        );
      }
    } finally {
      finishing.current = false;
      setRefreshing(false);
    }
  }
  function clearReadiness() {
    setReady(false);
    setReadyPlan(null);
    setFreshUsage(false);
  }
  return {
    isReady,
    readyPlan,
    hasFreshUsage,
    isRefreshing,
    finish,
    clearReadiness,
  };
}
