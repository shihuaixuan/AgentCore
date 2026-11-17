"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { isKey } from "@/lib/keyboard";
import { useRenameFileDialog } from "./useRenameFileDialog";

interface Props {
  file: WorkspaceFileItem;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RenameFileDialog({ file, isOpen, setIsOpen }: Props) {
  const { t } = useTranslation();
  const { name, setName, validationError, canSubmit, isPending, handleSubmit } =
    useRenameFileDialog(file, () => setIsOpen(false));

  return (
    <Dialog
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "28rem" }}
      title={t("Rename file", "重命名文件")}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-3">
          <Input
            id="rename-file-name"
            label={t("File name", "文件名")}
            placeholder={t("Enter file name", "输入文件名")}
            value={name}
            error={validationError ?? undefined}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (isKey(e, "Enter")) handleSubmit();
            }}
            className="w-full"
            wrapperClassName="!mb-0"
          />
          <Button
            variant="primary"
            className="mt-2"
            disabled={!canSubmit}
            loading={isPending}
            onClick={handleSubmit}
            data-testid="rename-file-submit"
          >
            {t("Save", "保存")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
