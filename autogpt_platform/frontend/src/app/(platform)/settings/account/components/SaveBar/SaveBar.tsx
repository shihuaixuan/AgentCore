"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";

interface Props {
  visible: boolean;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function SaveBar({ visible, saving, onDiscard, onSave }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-2 px-4">
      <Button
        variant="primary"
        size="large"
        onClick={onSave}
        loading={saving}
        disabled={saving || !visible}
      >
        {t("Save changes", "保存更改")}
      </Button>
      <Button
        variant="secondary"
        size="large"
        onClick={onDiscard}
        disabled={saving || !visible}
      >
        {t("Discard", "放弃")}
      </Button>
    </div>
  );
}
