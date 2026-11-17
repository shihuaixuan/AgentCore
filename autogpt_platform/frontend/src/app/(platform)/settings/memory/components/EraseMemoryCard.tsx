"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useState } from "react";

interface Props {
  scopeName: string;
  memoryCount: number | null;
  isErasing: boolean;
  onErase: () => Promise<boolean>;
}

export function EraseMemoryCard({
  scopeName,
  memoryCount,
  isErasing,
  onErase,
}: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.trim() === scopeName;

  async function handleErase() {
    if (!isConfirmed) return;
    const erased = await onErase();
    if (erased) setIsOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-large border border-error/30 bg-surface px-4 py-4 shadow-message-table sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <span className="flex text-error-foreground">
          <Text variant="body-medium" as="span" tone="inherit">
            {t(`Erase ${scopeName}'s memory`, `清除 ${scopeName} 的记忆`)}
          </Text>
        </span>
        <Text variant="small" as="span" tone="muted">
          {t(
            "Permanently delete everything this memory holds. This can't be undone.",
            "永久删除此范围内保存的全部记忆。此操作无法撤销。",
          )}
        </Text>
      </div>
      <Dialog
        title={t(
          `Erase all of ${scopeName}'s memory`,
          `清除 ${scopeName} 的全部记忆`,
        )}
        styling={{ maxWidth: "440px" }}
        controlled={{
          isOpen,
          set: (open) => {
            setIsOpen(open);
            if (open) setConfirmText("");
          },
        }}
      >
        <Dialog.Trigger>
          <Button variant="destructive" size="small">
            {t("Erase memory", "清除记忆")}
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <div className="flex flex-col gap-4">
            <Text variant="small" as="p" tone="secondary">
              {memoryCount !== null
                ? t(
                    `Every memory in this scope will be permanently deleted — ${memoryCount} ${memoryCount === 1 ? "memory" : "memories"}, raw conversations included. Other scopes are not affected.`,
                    `此范围内的全部 ${memoryCount} 条记忆（包括原始对话）将永久删除。其他范围不受影响。`,
                  )
                : t(
                    "Every memory in this scope will be permanently deleted, raw conversations included. Other scopes are not affected.",
                    "此范围内的全部记忆（包括原始对话）将永久删除。其他范围不受影响。",
                  )}{" "}
              {t("Type", "输入")} <strong>{scopeName}</strong>{" "}
              {t("to confirm.", "以确认。")}
            </Text>
            <Input
              id="erase-memory-confirm"
              label={t(
                `Type ${scopeName} to confirm`,
                `输入 ${scopeName} 以确认`,
              )}
              hideLabel
              placeholder={scopeName}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsOpen(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                variant="destructive"
                size="small"
                disabled={!isConfirmed}
                loading={isErasing}
                onClick={handleErase}
              >
                {t("Erase everything", "清除全部")}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
