"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import {
  getGetV1GetNotificationPreferencesQueryKey,
  getGetV1GetUserTimezoneQueryKey,
  postV1ApplyAVolumeKnobChoiceFromABriefingFooterLink,
  useGetV1GetNotificationPreferences,
  useGetV1GetUserTimezone,
  usePostV1UpdateNotificationPreferences,
  usePostV1UpdateUserTimezone,
} from "@/app/api/__generated__/endpoints/auth/auth";
import type { UpdateTimezoneRequestTimezone } from "@/app/api/__generated__/models/updateTimezoneRequestTimezone";
import { okData } from "@/app/api/helpers";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import {
  isUsernameIdentity,
  usernameSignupEnabled,
} from "@/lib/auth/local-username";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  detectBrowserTimezone,
  dirtyKinds,
  isFormDirty,
  preferencesToSettings,
  describeFooterChoice,
  settingsFromFooterLink,
  type BriefingFrequency,
  type NotificationSettings,
  type PreferencesFormState,
} from "./helpers";

const DEFAULT_SETTINGS: NotificationSettings = {
  briefingFrequency: "WEEKLY",
  alertsEnabled: true,
  storeVerdictsEnabled: true,
};

export function usePreferencesPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const emailSettingsEnabled =
    !usernameSignupEnabled() &&
    !!user?.email &&
    !isUsernameIdentity(user.email);
  const queryClient = useQueryClient();
  // The Briefing footer's volume knob links here with
  // ?f=daily|weekly|monthly|alerts|off. The design calls these "live one-click
  // links — a volume knob instead of a trapdoor", so the choice is saved on
  // arrival rather than pre-filling a form the reader still has to submit.
  //
  // The choice is only honoured with the signed token the email carried. The
  // session is the wrong authority here: applying on arrival off a bare ?f=
  // would let a third party change a signed-in reader's preferences just by
  // getting them to follow a link. The backend verifies an HMAC that binds the
  // choice to the recipient, so an unsigned or tampered link does nothing.
  const searchParams = useSearchParams();
  const footerChoice = emailSettingsEnabled ? searchParams.get("f") : null;
  const footerToken = searchParams.get("t");
  const router = useRouter();
  const pathname = usePathname();

  const preferencesQuery = useGetV1GetNotificationPreferences({
    query: {
      enabled: emailSettingsEnabled,
      select: okData,
    },
  });

  const timezoneQuery = useGetV1GetUserTimezone({
    query: {
      enabled: !!user,
      select: (res) => okData(res)?.timezone ?? "not-set",
    },
  });

  const isLoading =
    !user ||
    timezoneQuery.isLoading ||
    (emailSettingsEnabled && !preferencesQuery.data);

  const serverTimezone = timezoneQuery.data ?? "not-set";
  const formTimezone =
    serverTimezone !== "not-set" ? serverTimezone : detectBrowserTimezone();
  const initialSettings = preferencesQuery.data
    ? preferencesToSettings(preferencesQuery.data)
    : DEFAULT_SETTINGS;
  const initialFormState: PreferencesFormState = {
    timezone: formTimezone,
    notifications:
      settingsFromFooterLink(footerChoice, initialSettings) ?? initialSettings,
  };
  const initialSavedState: PreferencesFormState = {
    timezone: serverTimezone,
    notifications: initialSettings,
  };

  const [formState, setFormState] = useState<PreferencesFormState>({
    timezone: detectBrowserTimezone(),
    notifications: DEFAULT_SETTINGS,
  });
  const [savedState, setSavedState] = useState<PreferencesFormState>({
    timezone: detectBrowserTimezone(),
    notifications: DEFAULT_SETTINGS,
  });
  const [isSaving, setIsSaving] = useState(false);
  const hasInitializedFormState = useRef(false);
  const hasAppliedFooterChoice = useRef(false);

  const updateTimezone = usePostV1UpdateUserTimezone();
  const updateNotifications = usePostV1UpdateNotificationPreferences();

  async function applyFooterChoice(
    choice: string,
    token: string,
    next: NotificationSettings,
  ) {
    // Token-authenticated, not session-authenticated — see the note on
    // footerChoice above. Goes through the backend proxy: a bare
    // /api/auth/... fetch lands on the Next.js Better Auth catch-all and 404s.
    // The generated client throws ApiError on a non-2xx response.
    await postV1ApplyAVolumeKnobChoiceFromABriefingFooterLink({
      choice,
      token,
    });
    await queryClient.invalidateQueries({
      queryKey: getGetV1GetNotificationPreferencesQueryKey(),
    });
    setFormState((prev) => ({ ...prev, notifications: next }));
    setSavedState((prev) => ({ ...prev, notifications: next }));
  }

  async function applyNotificationSettings(next: NotificationSettings) {
    await updateNotifications.mutateAsync({
      data: {
        email: user?.email ?? "",
        briefing_frequency: next.briefingFrequency,
        alerts_enabled: next.alertsEnabled,
        store_verdicts_enabled: next.storeVerdictsEnabled,
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getGetV1GetNotificationPreferencesQueryKey(),
    });
    setFormState((prev) => ({ ...prev, notifications: next }));
    setSavedState((prev) => ({ ...prev, notifications: next }));
  }

  useEffect(
    function syncFormStateOnce() {
      if (hasInitializedFormState.current) return;
      if (emailSettingsEnabled && !preferencesQuery.isSuccess) return;
      if (!timezoneQuery.isSuccess) return;
      setFormState(initialFormState);
      setSavedState(initialSavedState);
      hasInitializedFormState.current = true;
    },
    [
      emailSettingsEnabled,
      initialFormState,
      initialSavedState,
      preferencesQuery.isSuccess,
      timezoneQuery.isSuccess,
    ],
  );

  useEffect(
    function applyFooterChoiceOnArrival() {
      if (hasAppliedFooterChoice.current) return;
      if (!hasInitializedFormState.current) return;
      if (!footerChoice || !footerToken) return;

      const chosen = settingsFromFooterLink(footerChoice, initialSettings);
      hasAppliedFooterChoice.current = true;
      router.replace(pathname);

      if (!chosen) return;

      applyFooterChoice(footerChoice, footerToken, chosen)
        .then(() => {
          toast({
            title: describeFooterChoice(footerChoice, locale),
            variant: "success",
          });
        })
        .catch(() => {
          // Leave the choice in the form so the reader can still hit Save.
          toast({
            title: t(
              "Couldn't update your email frequency",
              "无法更新邮件频率",
            ),
            description: t(
              "Your choice is selected below — press Save to retry.",
              "你的选择已在下方选中，请点击保存以重试。",
            ),
            variant: "destructive",
          });
        });
    },
    [footerChoice, footerToken, initialSettings, pathname, router, locale, t],
  );

  const dirty = isFormDirty(savedState, formState);
  const dirtyParts = dirtyKinds(savedState, formState);

  function setTimezone(value: string) {
    setFormState((prev) => ({ ...prev, timezone: value }));
  }

  function setBriefingFrequency(value: BriefingFrequency) {
    setFormState((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, briefingFrequency: value },
    }));
  }

  function setAlertsEnabled(value: boolean) {
    setFormState((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, alertsEnabled: value },
    }));
  }

  function setStoreVerdictsEnabled(value: boolean) {
    setFormState((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, storeVerdictsEnabled: value },
    }));
  }

  function discardChanges() {
    setFormState(savedState);
  }

  async function savePreferences() {
    if (!dirty || isSaving || !user) return;

    const snapshot = formState;
    const partsAtSubmit = dirtyParts;

    setIsSaving(true);

    let timezoneSaved = !partsAtSubmit.timezone;
    let notificationsSaved = !partsAtSubmit.notifications;
    const failures: string[] = [];

    if (partsAtSubmit.timezone) {
      try {
        const result = await updateTimezone.mutateAsync({
          data: {
            timezone: snapshot.timezone as UpdateTimezoneRequestTimezone,
          },
        });
        await queryClient.invalidateQueries({
          queryKey: getGetV1GetUserTimezoneQueryKey(),
        });
        const persistedTimezone =
          (result.status === 200 && result.data?.timezone) || snapshot.timezone;
        setSavedState((prev) => ({ ...prev, timezone: persistedTimezone }));
        timezoneSaved = true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("unknown error", "未知错误");
        failures.push(t(`Time zone: ${message}`, `时区：${message}`));
      }
    }

    if (partsAtSubmit.notifications) {
      try {
        await applyNotificationSettings(snapshot.notifications);
        notificationsSaved = true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("unknown error", "未知错误");
        failures.push(t(`Notifications: ${message}`, `通知：${message}`));
      }
    }

    setIsSaving(false);

    if (failures.length === 0) {
      toast({
        title: t("Preferences saved", "偏好设置已保存"),
        variant: "success",
      });
    } else if (timezoneSaved || notificationsSaved) {
      toast({
        title: t("Preferences partially saved", "偏好设置已部分保存"),
        description: failures.join("; "),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("Couldn't save preferences", "无法保存偏好设置"),
        description: failures.join("; "),
        variant: "destructive",
      });
    }
  }

  return {
    user,
    emailSettingsEnabled,
    isLoading,
    isError:
      (emailSettingsEnabled && preferencesQuery.isError) ||
      timezoneQuery.isError,
    error:
      (emailSettingsEnabled ? preferencesQuery.error : null) ??
      timezoneQuery.error,
    refetch: () => {
      if (emailSettingsEnabled) void preferencesQuery.refetch();
      void timezoneQuery.refetch();
    },
    formState,
    savedState,
    rawTimezone: timezoneQuery.data,
    dirty,
    isSaving,
    setTimezone,
    setBriefingFrequency,
    setAlertsEnabled,
    setStoreVerdictsEnabled,
    discardChanges,
    savePreferences,
  };
}
