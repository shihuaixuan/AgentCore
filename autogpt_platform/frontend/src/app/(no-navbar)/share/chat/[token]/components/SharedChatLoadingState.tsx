"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
export function SharedChatLoadingState() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="shared-chat-loading-state"
      className="flex h-full w-full flex-1 items-center justify-center"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-action"></div>
        <p className="text-body text-foreground-tertiary">
          {t("Loading shared chat…", "正在加载分享的聊天…")}
        </p>
      </div>
    </div>
  );
}
