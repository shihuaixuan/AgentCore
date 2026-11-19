"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  hasUpdate?: boolean;
  latestVersion?: number;
  hasUnpublishedChanges?: boolean;
  currentVersion?: number;
  isUpdating?: boolean;
  onUpdate?: () => void;
  onPublish?: () => void;
  onViewChanges?: () => void;
}

export function MarketplaceBanners({
  hasUpdate,
  latestVersion,
  hasUnpublishedChanges,
  isUpdating,
  onUpdate,
  onPublish,
}: Props) {
  const { t } = useTranslation();
  const renderUpdateBanner = () => {
    if (hasUpdate && latestVersion) {
      return (
        <div className="mb-6 rounded-lg bg-surface-muted p-4">
          <div className="flex flex-col gap-3">
            <div>
              <Text variant="large-medium" tone="primary" className="mb-2">
                {t("Update available", "有可用更新")}
              </Text>
              <Text variant="body" tone="body">
                {t(
                  "You should update your workflow in order to get the latest / best results",
                  "建议更新工作流，以获得最新、最佳的结果",
                )}
              </Text>
            </div>
            {onUpdate && (
              <div className="flex justify-start">
                <Button size="small" onClick={onUpdate} disabled={isUpdating}>
                  {isUpdating
                    ? t("Updating...", "正在更新…")
                    : t("Update workflow", "更新工作流")}
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderUnpublishedChangesBanner = () => {
    if (hasUnpublishedChanges) {
      return (
        <div className="mb-6 rounded-lg bg-surface-muted p-4">
          <div className="flex flex-col gap-3">
            <div>
              <Text variant="large-medium" tone="primary" className="mb-2">
                {t("Unpublished changes", "未发布的更改")}
              </Text>
              <Text variant="body" tone="body">
                {t(
                  "You've made changes to this workflow that aren't published yet. Would you like to publish the latest version?",
                  "此工作流有尚未发布的更改。是否发布最新版本？",
                )}
              </Text>
            </div>
            {onPublish && (
              <div className="flex justify-start">
                <Button size="small" onClick={onPublish}>
                  {t("Publish changes", "发布更改")}
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {renderUpdateBanner()}
      {renderUnpublishedChangesBanner()}
    </>
  );
}
