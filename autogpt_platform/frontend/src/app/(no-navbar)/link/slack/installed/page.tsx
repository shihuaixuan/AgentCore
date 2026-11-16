"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { useSlackInstalledHandoff } from "./useSlackInstalledHandoff";

export default function SlackInstalledPage() {
  const { t } = useTranslation();
  const { openSlackHref, openSlack } = useSlackInstalledHandoff();

  return (
    <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
      <AuthCard
        title={t("Slack connected", "已连接 Slack")}
        // oxlint-disable-next-line design-system/no-restyle -- AuthCard has no roomy size; keeps today's p-8 padding and gap-6
        className="max-w-[38rem] gap-6 p-8"
      >
        <div className="flex w-full flex-col items-center gap-7">
          <div className="w-full rounded-xl bg-surface-hover px-6 py-5 text-center">
            {/* The page navigates on its own, so announce it rather than
                letting a screen reader land somewhere unexplained. */}
            <Text
              variant="body-medium"
              tone="muted"
              role="status"
              aria-live="polite"
            >
              {t(
                "Opening Slack so you can finish linking your account.",
                "正在打开 Slack，以便完成账户关联。",
              )}
              <br />
              {t(
                "You'll be taken back to your bot settings in a moment.",
                "即将返回机器人设置。",
              )}
            </Text>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button size="small" onClick={openSlack}>
              {t("Open Slack", "打开 Slack")}
            </Button>
            <Button
              as="NextLink"
              href={openSlackHref}
              variant="outline"
              size="small"
            >
              {t("Open Slack in browser", "在浏览器中打开 Slack")}
            </Button>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
