"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Form, FormField } from "@/components/molecules/Form/Form";
import { useTopUpForm } from "./useTopUpForm";

interface Props {
  submitLabel?: string;
  size?: "small" | "normal";
}

export function TopUpForm({ submitLabel = "Top up", size = "normal" }: Props) {
  const { t } = useTranslation();
  const { form, isLoading, isRedirecting, submitTopUp } = useTopUpForm();
  const inputSize = size === "small" ? "small" : "medium";
  const buttonSize = size === "small" ? "small" : "large";

  return (
    <Form form={form} onSubmit={submitTopUp} className="my-4">
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <Input
            label={t("Amount", "金额")}
            type="amount"
            size={inputSize}
            decimalCount={0}
            id={field.name}
            error={form.formState.errors.amount?.message}
            amountPrefix="$"
            {...field}
          />
        )}
      />
      <Button
        type="submit"
        disabled={isLoading || isRedirecting}
        size={buttonSize}
      >
        {isLoading
          ? t("Redirecting…", "正在跳转…")
          : t(submitLabel, submitLabel === "Top up" ? "充值" : submitLabel)}
      </Button>
    </Form>
  );
}
