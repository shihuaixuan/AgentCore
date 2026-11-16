"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  reason?: string;
  onRetry: () => void;
};

export function SharedChatErrorState({ onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center">
      <div className="mx-auto w-full max-w-md p-6">
        <div className="space-y-4 rounded-lg border border-dashed border-border-strong p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-foreground-tertiary">
            <Icon icon={InformationCircleIcon} size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lead font-semibold">
              {t("Share link not found", "找不到分享链接")}
            </h3>
            <p className="text-body text-foreground-tertiary">
              {t(
                "This link is invalid or has been disabled by the owner. Ask the person who shared it for an updated link.",
                "此链接无效或已被所有者停用。请联系分享者获取新链接。",
              )}
            </p>
          </div>
          <button
            onClick={onRetry}
            className="text-body text-foreground-body underline hover:text-foreground-strong"
          >
            {t("Try again", "重试")}
          </button>
        </div>
        <p className="mt-8 text-center text-caption text-foreground-subtle">
          {t("Powered by AutoGPT Platform", "由 AutoGPT 平台提供支持")}
        </p>
      </div>
    </div>
  );
}
