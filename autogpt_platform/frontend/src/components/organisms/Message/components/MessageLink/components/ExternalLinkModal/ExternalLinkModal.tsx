"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExternalLinkModal({ url, isOpen, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Open external link", "打开外部链接")}
      styling={{ maxWidth: "30rem", minWidth: "auto" }}
      controlled={{
        isOpen,
        set: async (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body">
          {t(
            "You're about to visit an external website:",
            "你即将访问外部网站：",
          )}
        </Text>
        <div className="mt-2 rounded-md bg-surface-hover p-3">
          <Text variant="small-mono" className="break-all">
            {url}
          </Text>
        </div>
        <Dialog.Footer>
          <Button variant="secondary" onClick={onClose}>
            {t("Cancel", "取消")}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {t("Open link", "打开链接")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
