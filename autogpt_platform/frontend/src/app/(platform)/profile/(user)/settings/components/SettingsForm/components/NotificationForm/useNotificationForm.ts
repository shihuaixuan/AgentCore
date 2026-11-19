"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { NotificationPreference } from "@/app/api/__generated__/models/notificationPreference";
import type { User } from "@/lib/auth/types";
import { usePostV1UpdateNotificationPreferences } from "@/app/api/__generated__/endpoints/auth/auth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// The volume knob from the Briefing footer, not a checkbox list. Billing and
// account messages are service mail and are deliberately absent — they are
// sent regardless of what is set here.
const notificationFormSchema = z.object({
  briefingFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "OFF"]),
  alertsEnabled: z.boolean(),
  storeVerdictsEnabled: z.boolean(),
});

export type NotificationFormValues = z.infer<typeof notificationFormSchema>;

function createNotificationDefaultValues(
  preferences: NotificationPreference,
): NotificationFormValues {
  return {
    briefingFrequency: (preferences.briefing_frequency ??
      "WEEKLY") as NotificationFormValues["briefingFrequency"],
    alertsEnabled: preferences.alerts_enabled ?? true,
    storeVerdictsEnabled: preferences.store_verdicts_enabled ?? true,
  };
}

export function useNotificationForm({
  preferences,
  user,
}: {
  preferences: NotificationPreference;
  user: User;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const defaultValues = createNotificationDefaultValues(preferences);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  });

  const updateNotificationsMutation = usePostV1UpdateNotificationPreferences({
    mutation: {
      onError: (error) => {
        toast({
          title: t("Error updating notifications", "更新通知设置时出错"),
          description:
            error instanceof Error
              ? error.message
              : t(
                  "Failed to update notification preferences",
                  "更新通知偏好设置失败",
                ),
          variant: "destructive",
        });
      },
    },
  });

  async function onSubmit(values: NotificationFormValues) {
    try {
      await updateNotificationsMutation.mutateAsync({
        data: {
          email: user.email || "",
          briefing_frequency: values.briefingFrequency,
          alerts_enabled: values.alertsEnabled,
          store_verdicts_enabled: values.storeVerdictsEnabled,
        },
      });

      toast({
        title: t(
          "Successfully updated notification preferences",
          "通知偏好设置已更新",
        ),
      });
    } catch (error) {
      toast({
        title: t("Error updating notifications", "更新通知设置时出错"),
        description:
          error instanceof Error
            ? error.message
            : t("Something went wrong", "出现了问题"),
        variant: "destructive",
      });
    }
  }

  function onCancel() {
    form.reset(defaultValues);
  }

  return {
    form,
    onSubmit,
    onCancel,
    isLoading: updateNotificationsMutation.isPending,
  };
}
