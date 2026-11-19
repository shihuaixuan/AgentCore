import { useUpdateSubscriptionTier } from "@/app/api/__generated__/endpoints/credits/credits";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useCheckoutRedirect } from "@/hooks/useCheckoutRedirect";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getCheckoutReturnURLs } from "../SubscriptionTab/helpers";
import type { AbandonedPlan } from "./helpers";

// Opens the checkout the person left again, for someone whose card failed.
export function useCheckoutRetry(plan: AbandonedPlan | null) {
  const { t } = useTranslation();
  const { mutateAsync: updateTier, isPending } = useUpdateSubscriptionTier();
  const checkoutRedirect = useCheckoutRedirect();

  async function retry() {
    if (!plan || isPending || checkoutRedirect.isRedirecting) return;
    const { successURL, cancelURL } = getCheckoutReturnURLs(plan);
    try {
      const response = await updateTier({
        data: {
          tier: plan.tier,
          billing_cycle: plan.cycle,
          success_url: successURL,
          cancel_url: cancelURL,
          surface: "billing",
        },
      });
      const url = response.status === 200 ? response.data.url : undefined;
      if (!url) throw new Error("No checkout to open");
      window.location.href = url;
      checkoutRedirect.markRedirecting();
    } catch {
      toast({
        title: t("Couldn't open checkout", "无法打开结账页面"),
        description: t(
          "Pick your plan again below to retry.",
          "请在下方重新选择套餐以重试。",
        ),
        variant: "destructive",
      });
    }
  }

  return {
    retry: plan ? retry : undefined,
    isRetrying: isPending || checkoutRedirect.isRedirectingHere,
  };
}
