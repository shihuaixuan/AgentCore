"use client";

import { Button } from "@/components/atoms/Button/Button";
import { createIconComponent, Icon } from "@/components/atoms/Icon/Icon";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { BellRingIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useNotificationBanner } from "./useNotificationBanner";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Alert's `icon` prop takes a component, not icon data.
const BellRing = createIconComponent(BellRingIcon);

export function NotificationBanner() {
  const { t } = useTranslation();
  const { isVisible, handleTurnOn, handleDismiss } = useNotificationBanner();

  if (!isVisible) return null;

  return (
    <Alert variant="warning" icon={BellRing} aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <AlertDescription className="min-w-[12rem] flex-1">
          {t(
            "Get a notification when Otto or your experts finish, even when you switch tabs.",
            "即使切换标签页，也能在 Otto 或你的专家完成任务时收到通知。",
          )}
        </AlertDescription>
        <Button variant="primary" size="small" onClick={handleTurnOn}>
          {t("Turn on notifications", "开启通知")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label={t("Dismiss", "关闭")}
          title={t("Dismiss", "关闭")}
          className="hover:border-orange/25 hover:bg-orange/25"
        >
          <Icon icon={Cancel01Icon} className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
