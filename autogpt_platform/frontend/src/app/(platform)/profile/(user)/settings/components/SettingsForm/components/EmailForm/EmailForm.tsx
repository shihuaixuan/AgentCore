"use client";

import { FormProvider } from "react-hook-form";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import type { User } from "@/lib/auth/types";
import { useEmailForm } from "./useEmailForm";

type EmailFormProps = {
  user: User;
};

export function EmailForm({ user }: EmailFormProps) {
  const { t } = useTranslation();
  const { form, onSubmit, isLoading, currentEmail } = useEmailForm({ user });

  const hasError = Object.keys(form.formState.errors).length > 0;
  const isSameEmail = form.watch("email") === currentEmail;

  return (
    <div>
      <Text variant="h3" size="large-semibold">
        {t("Security & Access", "安全与访问")}
      </Text>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-0"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    id={field.name}
                    label={t("Email", "电子邮箱")}
                    placeholder="m@example.com"
                    type="text"
                    autoComplete="off"
                    className="w-full"
                    size="small"
                    error={fieldState.error?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              as="NextLink"
              href="/reset-password"
              className="min-w-[10rem]"
              size="small"
            >
              {t("Reset password", "重置密码")}
            </Button>
            <Button
              type="submit"
              disabled={hasError || isSameEmail}
              loading={isLoading}
              className="min-w-[10rem]"
              size="small"
            >
              {isLoading
                ? t("Saving...", "正在保存…")
                : t("Update email", "更新邮箱")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
