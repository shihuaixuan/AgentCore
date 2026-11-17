"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";

interface Props {
  message: string;
  conflict: boolean;
  retry: () => void;
}

export function ProgressError({ message, conflict, retry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3">
      <ErrorCard
        context={t("your onboarding progress", "首次使用向导进度")}
        responseError={{ message }}
        isOurProblem={!conflict}
        onRetry={retry}
      />
      {conflict && (
        <Button onClick={retry}>
          {t("Reload latest progress", "重新加载最新进度")}
        </Button>
      )}
    </div>
  );
}
