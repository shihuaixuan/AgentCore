"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  MICROSOFT_SETUP_MESSAGES,
  type MicrosoftSetupReason,
} from "@/lib/microsoft-setup";

interface Props {
  reason: MicrosoftSetupReason;
  onRetry?: () => void;
  retryLabel?: string;
}

// The person's own to fix: they declined, or Microsoft wants a new sign-in.
const OWN_REASONS: ReadonlySet<MicrosoftSetupReason> = new Set([
  "access_denied",
  "reconnect_required",
]);

export function MicrosoftAdminSetup({ reason, onRetry, retryLabel }: Props) {
  const { t } = useTranslation();

  const forAdmin = reason !== "app_setup_required" && !OWN_REASONS.has(reason);
  const [copyMessage, setCopyMessage] = useState("");

  async function copySetupLink() {
    const link = `${window.location.origin}/microsoft-setup`;
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(t("Setup link copied.", "设置链接已复制。"));
    } catch {
      setCopyMessage(
        t(
          `Share this link with your Microsoft admin: ${link}`,
          `请将此链接分享给 Microsoft 管理员：${link}`,
        ),
      );
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-base p-4">
      <Text variant="body" role="status">
        {MICROSOFT_SETUP_MESSAGES[reason]}
      </Text>
      {reason === "app_setup_required" && (
        <Text variant="small" tone="muted">
          {t(
            "Browser sign-in isn't set up on this AutoGPT server yet. Whoever runs it needs to add the Microsoft app's client ID, secret and callback address.",
            "此 AutoGPT 服务器尚未配置浏览器登录。服务器管理员需要添加 Microsoft 应用的客户端 ID、密钥和回调地址。",
          )}
        </Text>
      )}
      {forAdmin && (
        <Text variant="small" tone="muted">
          {t(
            "Anything already connected keeps working. Send the setup link to your Microsoft admin, or approve it yourself if you're the admin.",
            "已连接的服务仍可使用。请将设置链接发送给 Microsoft 管理员；如果您是管理员，也可自行批准。",
          )}
        </Text>
      )}
      <div className="flex flex-wrap gap-2">
        {forAdmin && (
          <Button variant="secondary" size="small" onClick={copySetupLink}>
            {t("Copy setup link for my admin", "复制给管理员的设置链接")}
          </Button>
        )}
        {onRetry && (
          <Button variant="ghost" size="small" onClick={onRetry}>
            {retryLabel ?? t("Try again", "重试")}
          </Button>
        )}
      </div>
      {copyMessage && (
        <Text variant="small" role="status">
          {copyMessage}
        </Text>
      )}
    </section>
  );
}
