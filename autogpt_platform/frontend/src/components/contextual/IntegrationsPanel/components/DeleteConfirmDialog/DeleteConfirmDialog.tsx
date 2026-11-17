"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemNames: string[];
  isPending?: boolean;
  onConfirm: () => void;
  variant?: "remove" | "force";
  /** Provider-specific consequence, when the generic wording would overstate
   *  or understate what actually stops working. */
  notice?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemNames,
  isPending = false,
  onConfirm,
  variant = "remove",
  notice,
}: Props) {
  const { t } = useTranslation();

  const count = itemNames.length;
  const isBulk = count > 1;
  const isForce = variant === "force";
  const title = isForce
    ? isBulk
      ? t(`Force remove ${count} integrations?`, `强制移除 ${count} 个集成？`)
      : t(
          `Force remove ${itemNames[0] ?? "this integration"}?`,
          `强制移除 ${itemNames[0] ?? "此集成"}？`,
        )
    : isBulk
      ? t(`Remove ${count} integrations?`, `移除 ${count} 个集成？`)
      : t(
          `Remove ${itemNames[0] ?? "this integration"}?`,
          `移除 ${itemNames[0] ?? "此集成"}？`,
        );
  const message = isForce
    ? isBulk
      ? t(
          "These credentials are referenced by active webhooks or workflows. Forcing removal may break them.",
          "这些凭据正被有效的 Webhook 或工作流引用。强制移除可能导致它们无法正常运行。",
        )
      : t(
          "This credential is referenced by an active webhook or workflow. Forcing removal may break it.",
          "此凭据正被有效的 Webhook 或工作流引用。强制移除可能导致其无法正常运行。",
        )
    : isBulk
      ? t(
          "This action cannot be undone. Experts and workflows using these credentials will lose access immediately.",
          "此操作无法撤销。使用这些凭据的专家和工作流将立即失去访问权限。",
        )
      : t(
          "This action cannot be undone. Experts and workflows using this credential will lose access immediately.",
          "此操作无法撤销。使用此凭据的专家和工作流将立即失去访问权限。",
        );
  const confirmLabel = isForce
    ? t("Force remove", "强制移除")
    : t("Remove", "移除");

  return (
    <Dialog
      title={title}
      styling={{ maxWidth: "28rem" }}
      controlled={{ isOpen: open, set: onOpenChange }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="body" tone="emphasis">
            {message}
          </Text>

          {notice && (
            <Text variant="small" tone="body">
              {notice}
            </Text>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="destructive"
              size="small"
              onClick={onConfirm}
              loading={isPending}
              disabled={isPending}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
