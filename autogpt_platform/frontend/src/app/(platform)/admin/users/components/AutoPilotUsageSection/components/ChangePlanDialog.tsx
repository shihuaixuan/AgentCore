"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  planName: string;
  isOpen: boolean;
  isChanging: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChangePlanDialog({
  planName,
  isOpen,
  isChanging,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={`${t("Change plan to", "将套餐改为")} ${planName}?`}
      styling={{ maxWidth: "480px" }}
      controlled={{
        isOpen,
        set: (open) => {
          if (!open) onCancel();
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body" tone="secondary">
          {t("Their AutoPilot limits change right away. If they pay through Stripe, the next billing sync sets the plan back to what they pay for.", "AutoPilot 限额会立即改变。如果用户通过 Stripe 付费，下次账单同步时套餐会恢复为实际付费套餐。")}
        </Text>
        <Dialog.Footer>
          <Button variant="secondary" size="small" onClick={onCancel}>
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="primary"
            size="small"
            loading={isChanging}
            onClick={onConfirm}
          >
            {t("Change plan", "更改套餐")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
