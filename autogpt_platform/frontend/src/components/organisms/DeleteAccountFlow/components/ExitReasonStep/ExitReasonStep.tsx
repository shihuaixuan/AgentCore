"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { QuestionOptionList } from "@/app/(platform)/copilot/components/ChainActionCard/QuestionOptionList";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useId } from "react";
import type { DeletionSource } from "../../helpers";
import { StepFooter } from "../StepFooter/StepFooter";
import { AlternativePanel } from "./components/AlternativePanel/AlternativePanel";
import { EXIT_REASON_LABELS, MAX_FEEDBACK_TEXT_LENGTH } from "./helpers";
import { useExitReasonStep } from "./useExitReasonStep";
import { DISPLAY_LABELS } from "@/components/organisms/FeedbackPrompts/display-labels";

interface Props {
  origin: DeletionSource;
  onClose: () => void;
  onContinue: () => void;
}

export function ExitReasonStep({ origin, onClose, onContinue }: Props) {
  const { t } = useTranslation();
  const labelID = useId();
  const textID = useId();
  const {
    reasonLabel,
    placeholder,
    text,
    setText,
    panel,
    isActionPending,
    selectReason,
    runAction,
    skip,
    submit,
  } = useExitReasonStep({ origin, onClose, onContinue });

  return (
    <div className="flex flex-col px-0.5">
      <div className="flex flex-col gap-4">
        <Text variant="body" tone="muted">
          {t(
            "Optional. You can skip straight to deleting, and your answer isn't linked to your account.",
            "此项选填。你可以直接跳过并删除账户，回答不会与你的账户关联。",
          )}
        </Text>
        <span id={labelID} className="sr-only">
          {t("Why are you leaving?", "你为什么选择离开？")}
        </span>
        <QuestionOptionList
          options={EXIT_REASON_LABELS.map((label) =>
            t(label, DISPLAY_LABELS[label] ?? label),
          )}
          value={t(reasonLabel, DISPLAY_LABELS[reasonLabel] ?? reasonLabel)}
          labelId={labelID}
          focusActiveOption={false}
          onChange={(label) =>
            selectReason(
              EXIT_REASON_LABELS.find(
                (english) =>
                  t(english, DISPLAY_LABELS[english] ?? english) === label,
              ) ?? label,
            )
          }
          onSubmit={submit}
          editable={false}
          required={false}
          selectedContent={
            panel ? (
              <AlternativePanel
                panel={panel}
                isActionPending={isActionPending}
                onAction={runAction}
              />
            ) : null
          }
        />
        <div role="status" className="sr-only">
          {panel?.copy}
        </div>
        <Input
          id={textID}
          type="textarea"
          rows={1}
          label={t("Tell us more", "请详细说明")}
          hideLabel
          placeholder={t(
            placeholder,
            DISPLAY_LABELS[placeholder] ?? placeholder,
          )}
          maxLength={MAX_FEEDBACK_TEXT_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          // A textarea so the placeholder wraps at 320px; the overrides beat
          // the atom's own 14px, one-line textarea classes.
          className="!min-h-16 resize-none scroll-mb-20 !text-body-lg lg:!min-h-[2.875rem] lg:!text-body [@media(max-height:300px)]:scroll-mb-0"
          wrapperClassName="mb-0"
        />
      </div>
      <StepFooter>
        <Button
          variant="outline"
          onClick={skip}
          className="flex-1 lg:flex-none"
        >
          {t("Skip", "跳过")}
        </Button>
        <Button onClick={submit} className="flex-1 lg:flex-none">
          {t("Continue", "继续")}
        </Button>
      </StepFooter>
    </div>
  );
}
