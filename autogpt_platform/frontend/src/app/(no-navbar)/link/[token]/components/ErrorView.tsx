"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { Unlink01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  message: string;
}

export function ErrorView({ message }: Props) {
  const { t } = useTranslation();
  return (
    <AuthCard title={t("Setup failed", "设置失败")}>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-surface text-error-foreground">
          <Icon icon={Unlink01Icon} size={40} />
        </div>
        <Text variant="body-medium" tone="muted" className="text-center">
          {message ===
          "This setup link is malformed. Ask the bot for a new one."
            ? t(message, "此设置链接格式无效，请向机器人索取新链接。")
            : message ===
                "Couldn't load setup details. The link may have expired."
              ? t(message, "无法加载设置详情，链接可能已过期。")
              : message ===
                  "Failed to complete setup. The link may have expired."
                ? t(message, "无法完成设置，链接可能已过期。")
                : message}
        </Text>
        <Text variant="small" tone="muted" className="text-center">
          {t(
            "Go back to your chat and ask the bot for a new setup link.",
            "请返回聊天，向机器人索取新的设置链接。",
          )}
        </Text>
      </div>
    </AuthCard>
  );
}
