"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  title?: string;
  message?: string;
}

export function LoadingView({
  title = "Setting up AutoGPT",
  message = "Loading...",
}: Props) {
  const { t } = useTranslation();
  return (
    <AuthCard
      title={
        title === "Setting up AutoGPT" ? t(title, "正在设置 AutoGPT") : title
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-foreground-strong">
          <Icon icon={Loading03Icon} size={48} />
        </div>
        <Text variant="body-medium" tone="muted">
          {message === "Loading..." ? t(message, "加载中…") : message}
        </Text>
      </div>
    </AuthCard>
  );
}
