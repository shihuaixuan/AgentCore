"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";

interface Props {
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function SaveBar({ dirty, saving, canSave, onDiscard, onSave }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-start gap-2">
      <Button
        variant="outline"
        size="large"
        onClick={onDiscard}
        disabled={!dirty || saving}
      >
        {t("Discard", "放弃")}
      </Button>
      <Button
        variant="primary"
        size="large"
        onClick={onSave}
        loading={saving}
        disabled={!canSave || saving}
      >
        {t("Save changes", "保存更改")}
      </Button>
    </div>
  );
}
