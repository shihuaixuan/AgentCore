"use client";

import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { CreateAPIKeyForm } from "./components/CreateAPIKeyForm";
import { CreateAPIKeySuccess } from "./components/CreateAPIKeySuccess";
import { useCreateAPIKeyForm } from "./useCreateAPIKeyForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAPIKeyDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { form, view, plainTextKey, isPending, handleSubmit, handleClose } =
    useCreateAPIKeyForm({ onClose: () => onOpenChange(false) });

  const isSuccess = view === "success";
  const title = isSuccess
    ? t("Your new API key", "你的新 API 密钥")
    : t("Create API key", "创建 API 密钥");

  return (
    <Dialog
      title={title}
      styling={{ maxWidth: "34rem" }}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          if (isPending) return;
          handleClose();
        },
      }}
    >
      <Dialog.Content>
        {isSuccess ? (
          <CreateAPIKeySuccess
            plainTextKey={plainTextKey}
            onClose={handleClose}
          />
        ) : (
          <CreateAPIKeyForm
            form={form}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        )}
      </Dialog.Content>
    </Dialog>
  );
}
