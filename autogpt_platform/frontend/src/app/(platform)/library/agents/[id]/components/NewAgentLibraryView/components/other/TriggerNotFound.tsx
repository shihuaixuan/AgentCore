"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { RunDetailCard } from "../selected-views/RunDetailCard/RunDetailCard";
import { SelectedViewLayout } from "../selected-views/SelectedViewLayout";

interface Props {
  agent: LibraryAgent;
  banner?: React.ReactNode;
  onClearSelection?: () => void;
}

export function TriggerNotFound({ agent, banner, onClearSelection }: Props) {
  const { t } = useTranslation();
  return (
    <SelectedViewLayout agent={agent} banner={banner}>
      <RunDetailCard title={t("Trigger not found", "未找到触发器")}>
        <div className="flex flex-col items-start gap-4">
          <Text variant="body" tone="muted">
            {t(
              "This trigger doesn't exist or is no longer available.",
              "此触发器不存在或已不可用。",
            )}
          </Text>
          {onClearSelection && (
            <Button variant="secondary" size="small" onClick={onClearSelection}>
              {t("Clear selection", "清除选择")}
            </Button>
          )}
        </div>
      </RunDetailCard>
    </SelectedViewLayout>
  );
}
