"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function ReportLoading() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

interface ErrorProps {
  message: string;
  isForbidden: boolean;
  onRetry: () => void;
}

export function ReportError({ message, isForbidden, onRetry }: ErrorProps) {
  const { t } = useTranslation();
  if (isForbidden) {
    return (
      <Text variant="small" tone="muted">
        {t("You no longer have admin access. Sign in again.", "管理员权限已失效，请重新登录。")}
      </Text>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <Text variant="small" tone="muted">
        {message}
      </Text>
      <Button variant="secondary" size="small" onClick={onRetry}>
        {t("Retry", "重试")}
      </Button>
    </div>
  );
}
