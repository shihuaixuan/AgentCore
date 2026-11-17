"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { PageCard } from "./PageCard";
import { StillClosedHelp } from "./StillClosedHelp";
import { useOpenAgain } from "./useOpenAgain";

interface Props {
  isReady: boolean;
  isLeaving: boolean;
  onContinue: () => void;
}

export function OpenAgain({ isReady, isLeaving, onContinue }: Props) {
  const { t } = useTranslation();
  const { headingID, continueID, statusText } = useOpenAgain(isReady);

  return (
    <PageCard
      title={t("Your account is open again", "账户已重新开放")}
      headingID={headingID}
    >
      <Text variant="body">
        {t(
          "Your plan, connected apps, API keys, schedules and share links stay off, and your Marketplace listings and reviews are removed: subscribe again and set up what you need. Notification emails stay off until you switch them back on in Settings.",
          "你的套餐、已连接应用、API 密钥、定时任务和分享链接仍处于停用状态，市场上架内容和评价已移除。请重新订阅并配置所需功能；通知邮件将保持关闭，直到你在设置中重新开启。",
        )}
      </Text>
      <StillClosedHelp />
      <div className="flex items-center justify-end gap-3">
        {/* One live region for the whole wait, so its change is announced. */}
        <Text variant="small" tone="muted" role="status" aria-live="polite">
          {statusText}
        </Text>
        {isReady ? (
          <Button
            id={continueID}
            type="button"
            onClick={onContinue}
            loading={isLeaving}
          >
            {t("Continue to AutoGPT", "继续使用 AutoGPT")}
          </Button>
        ) : (
          <LoadingSpinner size="small" aria-hidden />
        )}
      </div>
    </PageCard>
  );
}
