"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  session: { id: string; title: string | null | undefined } | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteChatDialog({
  session,
  isDeleting,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Delete chat", "删除对话")}
      styling={{ maxWidth: "30rem", minWidth: "auto" }}
      controlled={{
        isOpen: !!session,
        set: async (open) => {
          if (!open && !isDeleting) {
            onCancel();
          }
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body">
          {t("Are you sure you want to delete", "确定要删除")}{" "}
          <Text variant="body-medium" as="span">
            &quot;{session?.title || t("Untitled chat", "未命名对话")}&quot;
          </Text>
          {t("? This action cannot be undone.", "吗？此操作无法撤销。")}
        </Text>
        <Dialog.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
          >
            {t("Delete", "删除")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
