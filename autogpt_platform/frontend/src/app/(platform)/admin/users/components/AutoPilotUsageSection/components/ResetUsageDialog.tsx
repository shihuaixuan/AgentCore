"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useState } from "react";
import type { ResetScope } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  scope: ResetScope;
  nothingToReset: boolean;
  isResetting: boolean;
  onConfirm: (scope: ResetScope, onSuccess: () => void) => void;
}

export function ResetUsageDialog({
  scope,
  nothingToReset,
  isResetting,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const both = scope === "both";

  return (
    <Dialog
      title={both ? t("Reset daily and weekly usage?", "重置每日和每周使用量？") : t("Reset daily usage?", "重置每日使用量？")}
      styling={{ maxWidth: "480px" }}
      controlled={{ isOpen, set: setIsOpen }}
    >
      <Dialog.Trigger>
        <Button variant="secondary" size="small" disabled={nothingToReset}>
          {t("Reset…", "重置…")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Text variant="body" tone="secondary">
          {both
            ? t("Sets this user's AutoPilot spend for today and this week back to $0.00. Their limits don't change.", "将该用户今天和本周的 AutoPilot 消费重置为 $0.00，限额不变。")
            : t("Sets this user's AutoPilot spend for today back to $0.00. Their limits don't change.", "将该用户今天的 AutoPilot 消费重置为 $0.00，限额不变。")}
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
            loading={isResetting}
            onClick={() => onConfirm(scope, () => setIsOpen(false))}
          >
            {t("Reset", "重置")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
