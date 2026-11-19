"use client";

import type { AccessBlock } from "@/app/api/__generated__/models/accessBlock";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  formatBlockedAddress,
  formatDate,
  getErrorMessage,
} from "../../helpers";
import { useAccessBlocks } from "../../useAccessBlocks";

interface Props {
  block: AccessBlock;
  triggerVariant: "link" | "ghost";
}

export function UnblockDialog({ block, triggerVariant }: Props) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { deleteBlock, isDeleting } = useAccessBlocks();
  const value =
    block.kind === "IP" ? formatBlockedAddress(block.value) : block.value;

  async function unblock() {
    try {
      await deleteBlock(block.id);
    } catch (error) {
      toast({
        title: t("Couldn't unblock", "无法解除阻止"),
        description: getErrorMessage(error, locale),
        variant: "destructive",
      });
      return;
    }
    setIsOpen(false);
    toast({
      title: t(`Unblocked ${value}`, `已解除对 ${value} 的阻止`),
      variant: "success",
    });
  }

  return (
    <Dialog
      title={t(`Unblock ${value}?`, `解除对 ${value} 的阻止？`)}
      styling={{ maxWidth: "440px" }}
      controlled={{ isOpen, set: setIsOpen }}
    >
      <Dialog.Trigger>
        <Button variant={triggerVariant} size="small">
          {t("Unblock", "解除阻止")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-2">
          <Text variant="body" tone="secondary">
            {block.kind === "IP"
              ? t(
                  "Sign-ups and sign-ins from it are accepted again right away.",
                  "该地址将立即恢复注册和登录。",
                )
              : t(
                  "Sign-ups on it are accepted again right away.",
                  "该域名将立即恢复注册。",
                )}{" "}
            {t(
              "Accounts banned at the same time stay banned.",
              "同时被封禁的账户仍保持封禁状态。",
            )}
          </Text>
          <Text variant="small" tone="muted">
            {t(
              `Blocked by ${block.created_by_email ?? "unknown"} on ${formatDate(block.created_at, locale)}: “${block.reason}”.`,
              `由 ${block.created_by_email ?? "未知用户"} 于 ${formatDate(block.created_at, locale)} 阻止：“${block.reason}”。`,
            )}
          </Text>
        </div>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            disabled={isDeleting}
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="primary"
            size="small"
            loading={isDeleting}
            onClick={() => void unblock()}
          >
            {t("Unblock", "解除阻止")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
