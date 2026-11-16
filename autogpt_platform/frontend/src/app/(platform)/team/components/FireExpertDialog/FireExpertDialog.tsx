"use client";

import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getFireSummary } from "./helpers";
import {
  FireExpertFooter,
  FireExpertPreview,
} from "./FireExpertDialogSections";
import { useFireExpertDialog } from "./useFireExpertDialog";

type Props = {
  expertId: string;
  expertName: string;
  open: boolean;
  onClose: () => void;
  onFired?: () => void;
};

export function FireExpertDialog({
  expertId,
  expertName,
  open,
  onClose,
  onFired,
}: Props) {
  const { t } = useTranslation();
  const {
    preview,
    isPreviewLoading,
    isPreviewError,
    isPreviewReady,
    retryPreview,
    isFiring,
    handleFire,
  } = useFireExpertDialog({
    expertId,
    expertName,
    open,
    onClose,
    onFired,
  });
  const summary = getFireSummary(preview);

  // Match the disabled "Keep" button: while the archive request is in flight
  // ESC and overlay clicks must not dismiss either, or the user loses the
  // pending/success/failure feedback for a destructive action.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isFiring) onClose();
  }

  return (
    <Dialog
      variant="compact"
      controlled={{ isOpen: open, set: handleOpenChange }}
      styling={{ maxWidth: "30rem" }}
      title={t(`Fire ${expertName}?`, `解雇 ${expertName}？`)}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <FireExpertPreview
            expertName={expertName}
            automationLine={t(
              summary.automationLine,
              summary.items.length === 0
                ? "不会暂停任何自动化任务。"
                : `将暂停 ${summary.items.length} 项自动化任务。`,
            )}
            items={summary.items}
            isLoading={isPreviewLoading}
            isError={isPreviewError}
            isReady={isPreviewReady}
            onRetry={retryPreview}
          />
          <FireExpertFooter
            expertName={expertName}
            isFiring={isFiring}
            isPreviewLoading={isPreviewLoading}
            onClose={onClose}
            onFire={handleFire}
          />
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
