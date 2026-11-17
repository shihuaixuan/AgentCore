"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId } from "react";

import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Alert01Icon } from "@hugeicons/core-free-icons";

import { SettingRow } from "./components/SettingRow/SettingRow";
import { useNotificationSettings } from "./useNotificationSettings";

export function NotificationSettingsControls() {
  const { t } = useTranslation();
  const {
    isNotificationsEnabled,
    isSoundEnabled,
    isSupported,
    isBlocked,
    toggleNotifications,
    toggleSound,
  } = useNotificationSettings();
  const blockedExplainerId = useId();

  if (!isSupported) {
    return (
      <Text variant="small" as="p" tone="muted">
        {t(
          "This browser doesn't support notifications.",
          "此浏览器不支持通知。",
        )}
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SettingRow
        label={t("Notifications", "通知")}
        description={t(
          "Get told when your experts finish, even in another tab.",
          "专家完成任务时收到通知，即使你正在浏览其他标签页。",
        )}
        checked={isNotificationsEnabled}
        disabled={isBlocked}
        describedBy={isBlocked ? blockedExplainerId : undefined}
        onCheckedChange={toggleNotifications}
      />
      <SettingRow
        label={t("Sound", "声音")}
        description={t("Play a chime with each one.", "收到通知时播放提示音。")}
        checked={isSoundEnabled && isNotificationsEnabled}
        disabled={!isNotificationsEnabled}
        onCheckedChange={toggleSound}
      />

      {/* A browser-level denial is the one state we can't fix from in here —
          say so rather than leaving a switch that silently refuses to move. */}
      {isBlocked ? (
        <div
          id={blockedExplainerId}
          className="flex items-start gap-2 rounded-lg bg-surface-hover px-3 py-2"
        >
          <Icon
            icon={Alert01Icon}
            tone="muted"
            className="mt-0.5 size-4 shrink-0"
          />
          <Text variant="small" as="p" tone="secondary">
            {t(
              "Your browser is blocking notifications for AutoGPT. Allow them in its site settings to switch this back on.",
              "浏览器已阻止 AutoGPT 通知。请在网站设置中允许通知，然后重新开启。",
            )}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
