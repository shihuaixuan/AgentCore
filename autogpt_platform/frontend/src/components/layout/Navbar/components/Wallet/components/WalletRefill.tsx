"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import {
  TabsLine,
  TabsLineContent,
  TabsLineList,
  TabsLineTrigger,
} from "@/components/molecules/TabsLine/TabsLine";
import {
  useToast,
  useToastOnFail,
} from "@/components/molecules/Toast/use-toast";
import { TopUpForm } from "@/components/layout/TopUpPrompt/TopUpForm/TopUpForm";
import useCredits from "@/hooks/useCredits";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";

function createAutoRefillSchema(
  t: (english: string, chinese: string) => string,
) {
  return z
    .object({
      threshold: z
        .number({
          coerce: true,
          invalid_type_error: t("Enter min. balance", "请输入最低余额"),
        })
        .min(
          5,
          t(
            "Looks like your balance is too low for auto-refill. Try $5 or more.",
            "自动充值的余额阈值过低，请设置为 5 美元或以上。",
          ),
        ),
      refillAmount: z
        .number({
          coerce: true,
          invalid_type_error: t("Enter top-up amount", "请输入充值金额"),
        })
        .min(
          5,
          t(
            "Top-ups start at $5. Please enter a higher amount.",
            "最低充值金额为 5 美元，请输入更高金额。",
          ),
        ),
    })
    .refine((data) => data.refillAmount >= data.threshold, {
      message: t(
        "Your refill amount must be equal to or greater than the balance you entered above.",
        "充值金额必须大于或等于上方设置的余额阈值。",
      ),
      path: ["refillAmount"],
    });
}

export function WalletRefill() {
  const { t } = useTranslation();
  const autoRefillSchema = createAutoRefillSchema(t);
  const { toast } = useToast();
  const toastOnFail = useToastOnFail();

  const { autoTopUpConfig, updateAutoTopUpConfig } = useCredits({
    fetchInitialAutoTopUpConfig: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const autoRefillForm = useForm<z.infer<typeof autoRefillSchema>>({
    resolver: zodResolver(autoRefillSchema),
  });

  // Pre-fill the auto-refill form with existing values
  useEffect(() => {
    if (
      autoTopUpConfig &&
      autoTopUpConfig.amount > 0 &&
      autoTopUpConfig.threshold > 0 &&
      !autoRefillForm.getFieldState("threshold").isTouched &&
      !autoRefillForm.getFieldState("refillAmount").isTouched
    ) {
      autoRefillForm.setValue("threshold", autoTopUpConfig.threshold / 100);
      autoRefillForm.setValue("refillAmount", autoTopUpConfig.amount / 100);
    }
  }, [autoTopUpConfig, autoRefillForm]);

  const submitAutoTopUpConfig = useCallback(
    async (data: z.infer<typeof autoRefillSchema>) => {
      setIsLoading(true);
      await updateAutoTopUpConfig(data.refillAmount * 100, data.threshold * 100)
        .then(() => {
          toast({
            title: t(
              "Auto top-up config updated! 🎉",
              "自动充值设置已更新！🎉",
            ),
            variant: "success",
          });
        })
        .catch(toastOnFail(t("update auto top-up config", "更新自动充值设置")));
      setIsLoading(false);
    },
    [updateAutoTopUpConfig, toast, toastOnFail, t],
  );

  return (
    <div className="mx-1 border-b border-border-strong">
      <Text
        variant="small-medium-tight"
        as="p"
        tone="accent"
        className="mx-0 mt-4"
      >
        {t("Add credits to your balance", "为余额添加额度")}
      </Text>
      <Text variant="small-tight" as="p" tone="muted" className="mx-0 my-1">
        {t(
          "Choose a one-time top-up or set up automatic refills",
          "选择单次充值或设置自动充值",
        )}
      </Text>
      <TabsLine
        variant="pill"
        defaultValue="top-up"
        className="mt-4 mb-6 flex w-full flex-col items-center"
      >
        <TabsLineList className="mx-auto">
          <TabsLineTrigger value="top-up">
            {t("One-time top up", "单次充值")}
          </TabsLineTrigger>
          <TabsLineTrigger value="auto-refill">
            {t("Auto-refill", "自动充值")}
          </TabsLineTrigger>
        </TabsLineList>
        <div className="mt-4 w-full rounded-lg px-5 outline outline-1 outline-offset-2 outline-border-base">
          <TabsLineContent value="top-up" className="flex flex-col">
            <Text
              variant="body-medium-lh-snug"
              as="div"
              tone="primary"
              className="mt-2 justify-start"
            >
              {t("One-time top-up", "单次充值")}
            </Text>
            <Text
              variant="small-lh-tight"
              as="div"
              tone="muted"
              className="mt-1 justify-start"
            >
              {t(
                "Enter an amount (min. $5) and add credits instantly.",
                "输入金额（最低 5 美元），立即添加额度。",
              )}
            </Text>
            <TopUpForm submitLabel={t("Top up", "充值")} size="small" />
          </TabsLineContent>
          <TabsLineContent value="auto-refill" className="flex flex-col">
            <Text
              variant="body-medium-lh-snug"
              as="div"
              tone="primary"
              className="justify-start"
            >
              {t("Auto-refill", "自动充值")}
            </Text>
            <Text
              variant="small-lh-tight"
              as="div"
              tone="muted"
              className="mt-1 justify-start"
            >
              {t(
                "Choose a one-time top-up or set up automatic refills.",
                "选择单次充值或设置自动充值。",
              )}
            </Text>

            <FormProvider {...autoRefillForm}>
              <form
                onSubmit={autoRefillForm.handleSubmit(submitAutoTopUpConfig)}
                className="my-6"
              >
                <FormField
                  control={autoRefillForm.control}
                  name="threshold"
                  render={({ field }) => (
                    <Input
                      type="amount"
                      label={t(
                        "Refill when balance drops below:",
                        "余额低于以下金额时充值：",
                      )}
                      id={field.name}
                      size="small"
                      decimalCount={0}
                      error={autoRefillForm.formState.errors.threshold?.message}
                      amountPrefix="$"
                      {...field}
                    />
                  )}
                />
                <FormField
                  control={autoRefillForm.control}
                  name="refillAmount"
                  render={({ field }) => (
                    <Input
                      type="amount"
                      label={t("Add this amount:", "充值金额：")}
                      size="small"
                      decimalCount={0}
                      id={field.name}
                      error={
                        autoRefillForm.formState.errors.refillAmount?.message
                      }
                      amountPrefix="$"
                      {...field}
                    />
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="small"
                  className="mt-5"
                >
                  {t("Enable Auto-refill", "启用自动充值")}
                </Button>
              </form>
            </FormProvider>
          </TabsLineContent>
          <Text
            variant="small-lh-tight"
            as="div"
            tone="inherit"
            className="mb-3 justify-start"
          >
            <span className="text-foreground-tertiary">
              {t(
                "To update your billing details, head to",
                "如需更新账单信息，请前往",
              )}{" "}
            </span>
            <Link
              href="/settings/billing"
              className="cursor-pointer text-foreground-emphasis underline"
            >
              {t("Billing settings", "账单设置")}
            </Link>
          </Text>
        </div>
      </TabsLine>
    </div>
  );
}
