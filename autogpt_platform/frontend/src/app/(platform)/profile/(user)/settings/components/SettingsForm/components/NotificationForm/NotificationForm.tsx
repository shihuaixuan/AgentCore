"use client";

import { FormProvider } from "react-hook-form";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/molecules/Form/Form";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { NotificationPreference } from "@/app/api/__generated__/models/notificationPreference";
import type { User } from "@/lib/auth/types";
import {
  useNotificationForm,
  type NotificationFormValues,
} from "./useNotificationForm";
import { Switch } from "@/components/atoms/Switch/Switch";

type NotificationFormProps = {
  preferences: NotificationPreference;
  user: User;
};

const BRIEFING_OPTIONS = [
  { value: "DAILY", label: "Daily", chineseLabel: "每天" },
  { value: "WEEKLY", label: "Weekly", chineseLabel: "每周" },
  { value: "MONTHLY", label: "Monthly", chineseLabel: "每月" },
  { value: "OFF", label: "Off", chineseLabel: "关闭" },
];

export function NotificationForm({ preferences, user }: NotificationFormProps) {
  const { t } = useTranslation();
  const { form, onSubmit, onCancel, isLoading } = useNotificationForm({
    preferences,
    user,
  });

  return (
    <div>
      <Text variant="h3" size="large-semibold">
        {t("Notifications", "通知")}
      </Text>
      <Text variant="body" tone="muted" className="mt-2">
        {t(
          "Billing and account messages are always sent — they are about your account, not a promotion.",
          "账单和账户消息始终会发送——这些是账户相关消息，而非推广。",
        )}
      </Text>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-10"
        >
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="briefingFrequency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <div className="mb-2 space-y-0.5">
                    <Text variant="h4" size="body-medium">
                      {t("Briefing", "简报")}
                    </Text>
                    <Text variant="body">
                      {t(
                        "What your workflows got done, at around 07:30 your time. Never sent when nothing ran.",
                        "在当地时间约 07:30 汇总工作流完成的工作。没有运行记录时不会发送。",
                      )}
                    </Text>
                  </div>
                  <FormControl>
                    <Select
                      id="briefing-frequency"
                      label={t("Briefing frequency", "简报频率")}
                      hideLabel
                      value={field.value}
                      options={BRIEFING_OPTIONS.map((option) => ({
                        value: option.value,
                        label: t(option.label, option.chineseLabel),
                      }))}
                      onValueChange={(value) =>
                        field.onChange(
                          value as NotificationFormValues["briefingFrequency"],
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alertsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <Text variant="h4" size="body-medium">
                      {t("Alerts", "提醒")}
                    </Text>
                    <Text variant="body">
                      {t(
                        "Only when something is waiting on you — never for a successful run. At most two a day.",
                        "仅在有事项等待你处理时提醒，运行成功时不会提醒。每天最多两次。",
                      )}
                    </Text>
                  </div>
                  <FormControl>
                    <Switch
                      aria-label={t("Alerts", "提醒")}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storeVerdictsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <Text variant="h4" size="body-medium">
                      {t("Marketplace reviews", "市场评价")}
                    </Text>
                    <Text variant="body">
                      {t(
                        "When a workflow you submitted is approved or needs changes.",
                        "当你提交的工作流通过审核或需要修改时通知。",
                      )}
                    </Text>
                  </div>
                  <FormControl>
                    <Switch
                      aria-label={t("Marketplace reviews", "市场评价")}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-8">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="min-w-[10rem]"
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="min-w-[10rem]"
              loading={isLoading}
            >
              {isLoading
                ? t("Saving...", "正在保存…")
                : t("Save preferences", "保存偏好")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
