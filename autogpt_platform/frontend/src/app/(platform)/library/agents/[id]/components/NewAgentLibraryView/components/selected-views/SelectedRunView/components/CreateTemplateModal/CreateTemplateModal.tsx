"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { GraphExecution } from "@/app/api/__generated__/models/graphExecution";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
  run?: GraphExecution;
}

export function CreateTemplateModal({ isOpen, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    } finally {
      setIsCreating(false);
    }
  }

  function handleCancel() {
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <Dialog
      title={t("Create Template", "创建模板")}
      controlled={{ isOpen, set: () => onClose() }}
      styling={{ maxWidth: "500px" }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text variant="body" tone="secondary">
              {t(
                "Save this task as a template to reuse later with the same inputs and credentials.",
                "将此任务保存为模板，以后可复用相同的输入和凭据。",
              )}
            </Text>
          </div>

          <div className="flex w-[96%] flex-col gap-4 pl-1">
            <Input
              id="template-name"
              label={t("Name", "名称")}
              placeholder={t("Enter template name", "输入模板名称")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              type="textarea"
              id="template-description"
              label={t("Description", "描述")}
              placeholder={t("Optional description", "可选描述")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <Dialog.Footer className="mt-6">
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCancel}>
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!name.trim() || isCreating}
              loading={isCreating}
            >
              {t("Create Template", "创建模板")}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
