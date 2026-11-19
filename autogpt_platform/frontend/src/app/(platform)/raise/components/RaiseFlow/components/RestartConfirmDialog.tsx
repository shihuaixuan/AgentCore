"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RestartConfirmDialog({ open, onOpenChange, onConfirm }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Start over?", "重新开始？")}
      styling={{ maxWidth: "26rem" }}
      controlled={{ isOpen: open, set: onOpenChange }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="body" tone="emphasis">
            {t(
              "This clears every answer you have given so far and takes you back to the first question. It cannot be undone.",
              "这会清除目前填写的所有回答，并返回第一个问题。此操作无法撤销。",
            )}
          </Text>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onOpenChange(false)}
            >
              {t("Keep going", "继续填写")}
            </Button>
            <Button variant="destructive" size="small" onClick={onConfirm}>
              {t("Start over", "重新开始")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
