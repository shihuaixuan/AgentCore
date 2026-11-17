"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  credentialToDelete: { id: string; title: string } | null;
  warningMessage?: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onForceConfirm: () => void;
}

export function DeleteConfirmationModal({
  credentialToDelete,
  warningMessage,
  isDeleting,
  onClose,
  onConfirm,
  onForceConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog
      controlled={{
        isOpen: credentialToDelete !== null,
        set: (open) => {
          if (!open) onClose();
        },
      }}
      title={t("Delete credential", "删除凭据")}
      styling={{ maxWidth: "32rem" }}
    >
      <Dialog.Content>
        {warningMessage ? (
          <Text variant="large">{warningMessage}</Text>
        ) : (
          <Text variant="large">
            {t(
              `Are you sure you want to delete "${credentialToDelete?.title}"? This action cannot be undone.`,
              `确定要删除“${credentialToDelete?.title}”吗？此操作无法撤销。`,
            )}
          </Text>
        )}
        <Dialog.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            {t("Cancel", "取消")}
          </Button>
          {warningMessage ? (
            <Button
              variant="destructive"
              onClick={onForceConfirm}
              loading={isDeleting}
            >
              {t("Force Delete", "强制删除")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
            >
              {t("Delete", "删除")}
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
