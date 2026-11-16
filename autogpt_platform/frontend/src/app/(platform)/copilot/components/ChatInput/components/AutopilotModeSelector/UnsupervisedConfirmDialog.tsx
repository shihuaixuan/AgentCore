"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description: string;
}

export function UnsupervisedConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={title ?? t("Run this chat unsupervised?", "允许此对话自主执行？")}
      styling={{ maxWidth: "30rem", minWidth: "auto" }}
      controlled={{
        isOpen,
        set: async (open) => {
          if (!open) onCancel();
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body">{description}</Text>
        <Dialog.Footer>
          <Button variant="secondary" onClick={onCancel}>
            {t("Cancel", "取消")}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {t("Run unsupervised", "自主执行")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
