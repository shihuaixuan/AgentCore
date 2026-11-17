"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { TrialTimeLeft } from "./components/TrialTimeLeft";
import { WorthDoingPanel } from "./components/WorthDoingPanel";

interface Props {
  trial: TrialStatusResponse;
  isOpen: boolean;
  isResuming: boolean;
  onResume: () => void;
  onSubscribe: () => void;
  onClose: () => void;
}

export function TrialCanceledDialog({
  trial,
  isOpen,
  isResuming,
  onResume,
  onSubscribe,
  onClose,
}: Props) {
  const { t } = useTranslation();
  if (!trial.offer) return null;
  return (
    <Dialog
      title={t("Cancellation confirmed", "已确认取消")}
      styling={{ maxWidth: "29rem", minWidth: "auto" }}
      controlled={{
        isOpen,
        set: (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        <div
          data-slot="trial-canceled-dialog-body"
          className="flex flex-col gap-4"
        >
          <Text variant="body" tone="emphasis">
            {t("Your card won't be charged.", "不会向你的银行卡扣款。")}{" "}
            <TrialTimeLeft endsAt={trial.ends_at} />
          </Text>
          <WorthDoingPanel offer={trial.offer} endsAt={trial.ends_at} />
        </div>
        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={onResume}
            loading={isResuming}
            disabled={isResuming}
          >
            {t("Resume trial", "恢复试用")}
          </Button>
          <Button variant="primary" onClick={onSubscribe}>
            {t("Subscribe now", "立即订阅")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
