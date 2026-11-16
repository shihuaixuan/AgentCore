import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getPostV1CreateNewGraphMutationOptions,
  getPutV1UpdateGraphVersionMutationOptions,
} from "@/app/api/__generated__/endpoints/graphs/graphs";
import { Text } from "@/components/atoms/Text/Text";
import { useIsMutating } from "@tanstack/react-query";

export const GraphLoadingBox = ({
  flowContentLoading,
}: {
  flowContentLoading: boolean;
}) => {
  const { t } = useTranslation();
  const isCreating = useIsMutating({
    mutationKey: getPostV1CreateNewGraphMutationOptions().mutationKey,
  });
  const isUpdating = useIsMutating({
    mutationKey: getPutV1UpdateGraphVersionMutationOptions().mutationKey,
  });

  const isSaving = !!(isCreating || isUpdating);

  if (!flowContentLoading && !isSaving) {
    return null;
  }

  return (
    <div className="absolute top-[50%] left-[50%] z-[99] -translate-x-1/2 -translate-y-1/2">
      <div className="flex flex-col items-center gap-4 rounded-xlarge border border-border-base bg-surface p-8 shadow-lg">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-separator border-t-foreground-subtle"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {isSaving && (
            <Text variant="h4">{t("Saving Workflow", "正在保存工作流")}</Text>
          )}
          {flowContentLoading && (
            <Text variant="h4">{t("Loading Flow", "正在加载工作流")}</Text>
          )}

          {isSaving && (
            <Text variant="small">
              {t(
                "Please wait while we save your workflow...",
                "正在保存工作流，请稍候…",
              )}
            </Text>
          )}
          {flowContentLoading && (
            <Text variant="small">
              {t(
                "Please wait while we load your workflow...",
                "正在加载工作流，请稍候…",
              )}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};
