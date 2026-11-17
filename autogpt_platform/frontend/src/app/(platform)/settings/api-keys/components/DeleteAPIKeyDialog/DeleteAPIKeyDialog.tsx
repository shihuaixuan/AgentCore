"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

import { useRevokeAPIKey } from "../hooks/useRevokeAPIKey";

interface Props {
  open: boolean;
  keyIds: string[];
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteAPIKeyDialog({
  open,
  keyIds,
  onOpenChange,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const { revoke, isPending } = useRevokeAPIKey();
  const isBatch = keyIds.length > 1;

  async function handleConfirm() {
    const succeeded = await revoke(keyIds);
    if (!succeeded) return;
    onDeleted?.();
    onOpenChange(false);
  }

  return (
    <Dialog
      title={
        isBatch
          ? t(
              `Revoke ${keyIds.length} API keys?`,
              `撤销 ${keyIds.length} 个 API 密钥？`,
            )
          : t("Revoke API key?", "撤销 API 密钥？")
      }
      styling={{ maxWidth: "28rem" }}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (isPending) return;
          onOpenChange(next);
        },
      }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4 px-1">
          <Text variant="body" tone="body">
            {t(
              `This action cannot be undone. Integrations using ${isBatch ? "these keys" : "this key"} will immediately lose access.`,
              `此操作无法撤销。使用${isBatch ? "这些密钥" : "此密钥"}的集成将立即失去访问权限。`,
            )}
          </Text>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="destructive"
              loading={isPending}
              onClick={handleConfirm}
            >
              {isBatch
                ? t("Revoke keys", "撤销密钥")
                : t("Revoke key", "撤销密钥")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
