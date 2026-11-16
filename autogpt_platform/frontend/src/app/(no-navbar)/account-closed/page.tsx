"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { OpenAgain } from "./components/OpenAgain";
import { PageCard } from "./components/PageCard";
import { StillClosedHelp } from "./components/StillClosedHelp";
import { useAccountClosedPage } from "./useAccountClosedPage";

export default function AccountClosedPage() {
  const { t } = useTranslation();
  const {
    view,
    eraseDate,
    isReady,
    isKeeping,
    isLeaving,
    keepAccount,
    continueToApp,
    signOut,
  } = useAccountClosedPage();

  if (view === "loading" || view === "leaving") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <LoadingSpinner size="large" />
      </main>
    );
  }

  if (view === "open") {
    return (
      <OpenAgain
        isReady={isReady}
        isLeaving={isLeaving}
        onContinue={continueToApp}
      />
    );
  }

  return (
    <PageCard
      title={
        view === "error"
          ? t("We couldn't load your account", "无法加载账户")
          : t("Your account is closed", "账户已关闭")
      }
    >
      {view === "error" && (
        <Text variant="body">
          {t("Reload the page to try again.", "请刷新页面重试。")}
        </Text>
      )}
      {view === "too_late" && (
        <>
          <Text variant="body">
            {t(
              "The 14 days to keep your account are over, and everything in it is being erased.",
              "保留账户的 14 天期限已过，正在清除账户及其中的所有内容。",
            )}
          </Text>
          <StillClosedHelp variant="too_late" />
        </>
      )}
      {view === "closed" && (
        <>
          <Text variant="body">
            {t(
              `We'll erase your account and everything in it on ${eraseDate}. Changed your mind? Keep your account and use AutoGPT again.`,
              `我们将在 ${eraseDate} 清除账户及其中的所有内容。改变主意了？你可以保留账户并继续使用 AutoGPT。`,
            )}
          </Text>
          <Text variant="small" tone="muted">
            {t(
              "Your plan, connected apps, API keys, schedules and share links stopped and your Marketplace listings and reviews were removed when you closed your account, and notification emails are off. If you keep it, subscribe again, set up what you need and switch emails back on in Settings.",
              "关闭账户时，你的套餐、已连接应用、API 密钥、定时任务和分享链接已停用，市场上架内容和评价已移除，通知邮件已关闭。若保留账户，请重新订阅，配置所需功能，并在设置中重新开启邮件。",
            )}
          </Text>
        </>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={signOut}
          disabled={isKeeping || isLeaving}
        >
          {t("Sign out", "退出登录")}
        </Button>
        {view === "closed" && (
          <Button
            type="button"
            onClick={keepAccount}
            loading={isKeeping}
            disabled={isLeaving}
          >
            {t("Keep my account", "保留我的账户")}
          </Button>
        )}
      </div>
    </PageCard>
  );
}
