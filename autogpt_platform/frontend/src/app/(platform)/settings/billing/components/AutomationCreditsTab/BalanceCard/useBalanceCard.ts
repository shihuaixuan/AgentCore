"use client";

import { useState } from "react";

import {
  useGetV1GetUserCredits,
  usePostV1RequestCreditTopUp,
} from "@/app/api/__generated__/endpoints/credits/credits";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useCheckoutRedirect } from "@/hooks/useCheckoutRedirect";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useBalanceCard() {
  const { t } = useTranslation();
  const {
    data: balanceCents,
    isLoading,
    isError,
    refetch,
  } = useGetV1GetUserCredits({
    query: {
      select: (res) => {
        const raw = res.data as { credits?: number } | undefined;
        return typeof raw?.credits === "number" ? raw.credits : null;
      },
    },
  });

  const { mutateAsync: requestTopUp, isPending: isRequestingTopUp } =
    usePostV1RequestCreditTopUp();
  const checkoutRedirect = useCheckoutRedirect();
  const isAdding = isRequestingTopUp || checkoutRedirect.isRedirectingHere;

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const numericAmount = Number.parseFloat(amount);
  // Backend `top_up_intent` rejects non-whole-dollar amounts
  // (`amount % 100 != 0`), so gate decimals client-side to surface the
  // error before checkout instead of after a failed Stripe redirect.
  const isValid =
    Number.isFinite(numericAmount) &&
    Number.isInteger(numericAmount) &&
    numericAmount >= 5;

  async function handleSubmit() {
    if (!isValid || isAdding || checkoutRedirect.isRedirecting) return;
    try {
      const result = await requestTopUp({
        data: {
          credit_amount: Math.round(numericAmount * 100),
          surface: "billing",
        },
      });
      const status = (result as { status?: number } | undefined)?.status;
      const body = result?.data as
        | { checkout_url?: string; detail?: string | { msg?: string } }
        | undefined;

      if (status && status >= 400) {
        // Surface backend error detail (FastAPI conventionally returns
        // ``{"detail": "..."}``) instead of the generic "no URL" message —
        // the actual failure is almost always a Stripe-side error
        // (stale customer ID, missing product, invalid API key) that the
        // user / their team needs to see to fix.
        const detail =
          typeof body?.detail === "string"
            ? body.detail
            : (body?.detail?.msg ??
              t(`Server returned ${status}.`, `服务器返回状态码 ${status}。`));
        throw new Error(detail);
      }

      const url = body?.checkout_url;
      if (url) {
        window.location.href = url;
        checkoutRedirect.markRedirecting();
        return;
      }

      throw new Error(
        t(
          "Stripe didn't return a checkout URL. Check backend logs for the underlying Stripe error.",
          "Stripe 未返回结账链接。请查看后端日志以了解具体的 Stripe 错误。",
        ),
      );
    } catch (error) {
      toast({
        title: t("Couldn't start checkout", "无法开始结账"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "Something went wrong contacting Stripe. Please try again.",
                "联系 Stripe 时出现问题，请重试。",
              ),
        variant: "destructive",
      });
    }
  }

  return {
    balanceCents: balanceCents ?? null,
    isLoading,
    isError,
    refetch,
    open,
    setOpen,
    amount,
    setAmount,
    isValid,
    isAdding,
    // Any checkout on the page leaving for Stripe, not just this one.
    isRedirecting: checkoutRedirect.isRedirecting,
    handleSubmit: () => void handleSubmit(),
  };
}
