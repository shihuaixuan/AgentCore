"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";

import { useLowCreditBanner } from "./useLowCreditBanner";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  className?: string;
}

export function LowCreditBanner({ className }: Props) {
  const { t } = useTranslation();
  const { visible, openTopUp, dismiss } = useLowCreditBanner();

  if (!visible) return null;

  const alert = (
    <Alert variant="warning" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <AlertDescription className="min-w-[12rem] flex-1">
          {t(
            "You're out of automation credits. Top up to keep your workflows running.",
            "自动化额度已用完。充值后即可继续运行工作流。",
          )}
        </AlertDescription>
        <Button variant="primary" size="small" onClick={openTopUp}>
          {t("Top up", "充值")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          aria-label={t("Dismiss", "关闭")}
          title={t("Dismiss", "关闭")}
          className="hover:border-warning/20 hover:bg-warning/20"
        >
          <Icon icon={Cancel01Icon} className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );

  return className ? <div className={className}>{alert}</div> : alert;
}
