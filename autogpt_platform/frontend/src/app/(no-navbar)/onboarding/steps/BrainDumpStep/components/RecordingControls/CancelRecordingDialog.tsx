"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CancelRecordingDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Discard recording?", "丢弃录音？")}
      className="max-w-[30rem] min-w-0"
      controlled={{ isOpen, set: onOpenChange }}
    >
      <Dialog.Content>
        <Text variant="body">
          {t(
            "This permanently deletes your current take. You can keep recording or discard it and start again.",
            "这将永久删除当前录音。你可以继续录音，也可以丢弃后重新开始。",
          )}
        </Text>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onOpenChange(false)}
            className="h-10"
          >
            {t("Keep recording", "继续录音")}
          </Button>
          <Button
            variant="destructive"
            size="small"
            onClick={onConfirm}
            className="h-10"
          >
            {t("Discard recording", "丢弃录音")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
