"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { FormEvent, useEffect, useState } from "react";
import { POD_NAME_MAX_LENGTH } from "../../helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isCreating: boolean;
}

export function NewPodDialog({ open, onClose, onCreate, isCreating }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    onCreate(trimmed);
  }

  return (
    <Dialog
      variant="compact"
      title={t("New pod", "新建小组")}
      styling={{ maxWidth: "28rem" }}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next) onClose();
        },
      }}
    >
      <Dialog.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
          <Input
            id="pod-name"
            size="small"
            label={t("Pod name", "小组名称")}
            labelVariant="small-medium"
            placeholder="e.g. Growth"
            value={name}
            maxLength={POD_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            wrapperClassName="!mb-0"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="small"
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              size="small"
              type="submit"
              variant="primary"
              disabled={!trimmed || isCreating}
              loading={isCreating}
            >
              {t("Create pod", "创建小组")}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
