"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useState } from "react";
import { PencilIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { isKey } from "@/lib/keyboard";

interface Props {
  currentName: string;
}

export function EditNameDialog({ currentName }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const { refreshSession } = useAuth();
  const { toast } = useToast();

  function handleOpenChange(open: boolean) {
    if (open) setName(currentName);
    setIsOpen(open);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSaving(true);
    async function save() {
      // preferred_name is also written by onboarding's "What should I call you?"
      const res = await fetch("/api/auth/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_name: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json();
        toast({
          title: t("Failed to update name", "更新名称失败"),
          description: body.error ?? t("Unknown error", "未知错误"),
          variant: "destructive",
        });
        return;
      }

      const session = await refreshSession();
      if (session?.error) {
        toast({
          title: t(
            "Name saved, but session refresh failed",
            "名称已保存，但会话刷新失败",
          ),
          description: session.error,
          variant: "destructive",
        });
        setIsOpen(false);
        return;
      }
      setIsOpen(false);
      toast({ title: t("Name updated", "名称已更新") });
    }
    await save().finally(() => {
      setIsSaving(false);
    });
  }

  return (
    <Dialog
      title={t("Edit display name", "修改显示名称")}
      styling={{ maxWidth: "24rem" }}
      controlled={{ isOpen, set: handleOpenChange }}
    >
      <Dialog.Trigger>
        <button
          type="button"
          className="ml-1 inline-flex items-center text-brand transition-colors hover:text-accent-strong"
        >
          <Icon icon={PencilIcon} size={16} />
        </button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4 px-1">
          <Input
            id="display-name"
            label={t("Display name", "显示名称")}
            placeholder={t("Your name", "你的名称")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (isKey(e, "Enter")) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            loading={isSaving}
          >
            {t("Save", "保存")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
