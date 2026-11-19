"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import type { ReactNode } from "react";
import { NoInitialFocus } from "./components/NoInitialFocus";
import { ReasonTiles } from "./components/ReasonTiles";
import { MAX_FEEDBACK_NOTE_CHARS, TRIAL_CANCEL_REASONS } from "./helpers";
import {
  type CancelTrialAnswer,
  useCancelTrialFeedback,
} from "./useCancelTrialFeedback";

const REASON_LABEL = "What's the main reason? (optional)";

interface Props {
  trigger?: ReactNode;
  endDate?: string;
  isCanceling?: boolean;
  initialReason?: string | null;
  onOpen?: () => void;
  onReason?: (value: string) => void;
  onConfirm?: (answer: CancelTrialAnswer) => void;
}

// One dialog, with Keep trial and Cancel trial always in reach: the reason is
// optional and never stands between someone and the cancel button.
export function CancelTrialFeedbackDialog({
  trigger,
  endDate = "November 4",
  isCanceling = false,
  initialReason = null,
  onOpen,
  onReason,
  onConfirm,
}: Props) {
  const { t, locale } = useTranslation();
  const localizedEndDate =
    locale === "zh-CN" && endDate === "November 4" ? "11 月 4 日" : endDate;
  const flow = useCancelTrialFeedback({
    startsOpen: !trigger,
    initialReason,
    onOpen,
    onReason,
    onConfirm,
  });

  return (
    <Dialog
      title={t("Cancel your trial?", "取消试用？")}
      styling={{ maxWidth: "38rem", minWidth: "auto" }}
      controlled={{ isOpen: flow.isOpen, set: flow.setOpen }}
    >
      {trigger ? <Dialog.Trigger>{trigger}</Dialog.Trigger> : null}
      <Dialog.Content>
        <NoInitialFocus />
        <div className="flex flex-col gap-5">
          <div
            data-slot="cancel-trial-dialog-body"
            className="flex flex-col gap-3"
          >
            <Text variant="body" tone="emphasis">
              {t(
                "Your trial won't convert to a paid plan and your card won't be charged.",
                "你的试用不会转为付费套餐，也不会向银行卡扣款。",
              )}
            </Text>
            <Text variant="body" tone="emphasis">
              {t("You keep full access until ", "你仍可完整使用至 ")}
              <strong>{localizedEndDate}</strong>
              {t(
                ", and you can resume your trial any time before then.",
                "，并可在此之前随时恢复试用。",
              )}
            </Text>
          </div>
          <div className="flex flex-col gap-3">
            <Text variant="body-medium" tone="primary">
              {t(REASON_LABEL, "主要原因是什么？（选填）")}
            </Text>
            <ReasonTiles
              reasons={TRIAL_CANCEL_REASONS}
              label={t(REASON_LABEL, "主要原因是什么？（选填）")}
              selected={flow.reason}
              onSelect={flow.pickReason}
              size="compact"
            />
            {flow.asksForNote ? (
              <Textarea
                maxLength={MAX_FEEDBACK_NOTE_CHARS}
                rows={2}
                value={flow.note}
                onChange={(e) => flow.setNote(e.target.value)}
                aria-label={t(
                  "Tell us a bit more (optional)",
                  "请详细说明（选填）",
                )}
                placeholder={t(
                  "Tell us a bit more (optional)",
                  "请详细说明（选填）",
                )}
                className="min-h-0 resize-none"
              />
            ) : null}
          </div>
        </div>
        <Dialog.Footer className="items-center gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => flow.setOpen(false)}
          >
            {t("Keep trial", "保留试用")}
          </Button>
          <Button size="small" disabled={isCanceling} onClick={flow.confirm}>
            {t("Cancel trial", "取消试用")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
