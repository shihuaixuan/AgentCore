import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useToastOnFail } from "@/components/molecules/Toast/use-toast";
import { useCheckoutRedirect } from "@/hooks/useCheckoutRedirect";
import useCredits from "@/hooks/useCredits";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function createTopUpSchema(t: (english: string, chinese: string) => string) {
  return z.object({
    amount: z
      .number({
        coerce: true,
        invalid_type_error: t("Enter top-up amount", "请输入充值金额"),
      })
      .int(t("Enter a whole-dollar amount", "请输入整数美元金额"))
      .min(
        5,
        t(
          "Top-ups start at $5. Please enter a higher amount.",
          "最低充值金额为 5 美元，请输入更高金额。",
        ),
      ),
  });
}

export function useTopUpForm() {
  const { t } = useTranslation();
  const topUpSchema = createTopUpSchema(t);
  const toastOnFail = useToastOnFail();
  const { requestTopUp } = useCredits();

  const [isRequesting, setIsRequesting] = useState(false);
  const checkoutRedirect = useCheckoutRedirect();
  const isLoading = isRequesting || checkoutRedirect.isRedirectingHere;

  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
  });

  async function submitTopUp(data: z.infer<typeof topUpSchema>) {
    if (isLoading || checkoutRedirect.isRedirecting) return;
    setIsRequesting(true);
    await requestTopUp(Math.round(data.amount * 100))
      .then(() => checkoutRedirect.markRedirecting())
      .catch(toastOnFail(t("request top-up", "申请充值")))
      .finally(() => setIsRequesting(false));
  }

  return {
    form,
    isLoading,
    // Any checkout on the page leaving for Stripe, not just this one.
    isRedirecting: checkoutRedirect.isRedirecting,
    submitTopUp,
  };
}
