"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  isOpen: boolean;
  planLabel: string;
  price: string;
  isSaving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmTrialPlanDialog({
  isOpen,
  planLabel,
  price,
  isSaving,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t(`Start ${planLabel} today?`, `今天开始使用 ${planLabel}？`)}
      styling={{ maxWidth: "28rem", minWidth: "auto" }}
      controlled={{
        isOpen,
        set: (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        <Text variant="body">
          {t(
            `Your trial ends now and your saved card is charged ${price}, plus applicable tax.`,
            `你的试用将立即结束，系统将向已保存的银行卡收取 ${price}，另加适用税费。`,
          )}
        </Text>
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("Keep my trial", "继续试用")}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isSaving}
            loading={isSaving}
          >
            {t(`Subscribe to ${planLabel}`, `订阅 ${planLabel}`)}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
