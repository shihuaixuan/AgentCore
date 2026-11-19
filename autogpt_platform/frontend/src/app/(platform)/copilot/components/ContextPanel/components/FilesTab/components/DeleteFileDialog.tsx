import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  fileName: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteFileDialog({
  fileName,
  isDeleting,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Delete file", "删除文件")}
      styling={{ maxWidth: "30rem", minWidth: "auto" }}
      controlled={{
        isOpen: !!fileName,
        set: async (open) => {
          if (!open && !isDeleting) onCancel();
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body">
          {t("Delete ", "删除 ")}
          <Text variant="body-medium" as="span">
            &quot;{fileName}&quot;
          </Text>
          {t(
            "? This removes it from the workspace and cannot be undone.",
            "？此操作会将其从工作区移除，且无法撤销。",
          )}
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
