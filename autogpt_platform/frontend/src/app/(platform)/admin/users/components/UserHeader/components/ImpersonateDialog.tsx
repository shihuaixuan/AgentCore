"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { UserSwitchIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { type AdminUser, getDisplayName } from "../../../helpers";

interface Props {
  user: AdminUser;
  currentImpersonationID: string | null;
  isStarting: boolean;
  onConfirm: () => Promise<void>;
}

export function ImpersonateDialog({
  user,
  currentImpersonationID,
  isStarting,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      title={`${t("Impersonate", "模拟登录")} ${getDisplayName(user)}?`}
      styling={{ maxWidth: "480px" }}
      controlled={{ isOpen, set: setIsOpen }}
    >
      <Dialog.Trigger>
        <Button variant="secondary" size="small" leadingIcon={UserSwitchIcon}>
          {t("Impersonate", "模拟登录")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Text variant="body" tone="secondary">
          {t(
            "You'll see and act as this user across the whole platform until you stop. A notice goes to the audit channel first, then this page reloads.",
            "在你停止模拟登录之前，你将以此用户的身份查看和操作整个平台。系统会先向审计频道发送通知，然后重新加载此页面。",
          )}
          {currentImpersonationID
            ? ` ${t("This ends your current impersonation of", "这会结束当前对该用户的模拟登录：")} ${currentImpersonationID}.`
            : null}
        </Text>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="primary"
            size="small"
            loading={isStarting}
            onClick={() => void onConfirm()}
          >
            {t("Impersonate", "模拟登录")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
