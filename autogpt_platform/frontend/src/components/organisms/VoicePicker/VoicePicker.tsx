"use client";

import type { VoiceSample } from "@/app/api/__generated__/models/voiceSample";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId } from "react";
import { CustomVoiceOption } from "./components/CustomVoiceOption";
import { SampleCard } from "./components/SampleCard";
import type { VoicePickResult } from "./helpers";
import type { SelectableCardColors } from "./helpers";
import { useVoicePicker } from "./useVoicePicker";

interface Props {
  name?: string;
  samples: VoiceSample[];
  onPick: (result: VoicePickResult) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  // Set when the surrounding flow already asked the question in its own copy.
  hideHeader?: boolean;
  // Overrides the accent used on option labels (e.g. the expert's colour).
  labelClassName?: string;
  // Overrides the card's selected/hover/focus treatment to match that colour.
  cardColors?: SelectableCardColors;
  // Dense layout for a small dialog: tighter spacing, smaller type.
  compact?: boolean;
}

export function VoicePicker({
  name,
  samples,
  onPick,
  onSkip,
  isSubmitting = false,
  hideHeader = false,
  labelClassName,
  cardColors,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const choiceGroupName = useId();
  const customTextareaId = useId();
  const {
    selected,
    customText,
    selectSample,
    focusCustom,
    changeCustom,
    canSubmit,
    submit,
  } = useVoicePicker({ onPick });

  return (
    <div
      data-slot="voice-picker"
      className={cn("flex flex-col", compact ? "gap-4" : "gap-6")}
    >
      {hideHeader ? null : (
        <header
          data-slot="voice-picker-header"
          className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}
        >
          <h2
            data-slot="voice-picker-title"
            className={cn(
              "text-foreground-base",
              compact
                ? "text-body-lg font-medium"
                : "text-heading-md font-semibold tracking-heading",
            )}
          >
            {name
              ? t(`How should ${name} write?`, `你希望 ${name} 如何写作？`)
              : t("How should this expert write?", "你希望这位专家如何写作？")}
          </h2>
          <p
            data-slot="voice-picker-description"
            className={cn(
              "text-foreground-tertiary",
              compact ? "text-body" : "text-body-lg",
            )}
          >
            {t(
              "Pick the voice that feels right. You can fine-tune it anytime in the Soul editor.",
              "选择合适的写作风格。你可以随时在灵魂编辑器中微调。",
            )}
          </p>
        </header>
      )}

      <fieldset
        data-slot="voice-picker-options"
        className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}
      >
        <legend data-slot="voice-picker-legend" className="sr-only">
          {t("Writing voice", "写作风格")}
        </legend>
        {samples.slice(0, 2).map((sample, index) => {
          const choice = index === 0 ? "a" : "b";
          return (
            <SampleCard
              key={choice}
              sample={sample}
              choice={choice}
              choiceGroupName={choiceGroupName}
              isSelected={selected === choice}
              labelClassName={labelClassName}
              colors={cardColors}
              compact={compact}
              onSelect={() => selectSample(choice)}
            />
          );
        })}

        <CustomVoiceOption
          choiceGroupName={choiceGroupName}
          textareaId={customTextareaId}
          customText={customText}
          isSelected={selected === "custom"}
          labelClassName={labelClassName}
          colors={cardColors}
          compact={compact}
          onFocus={focusCustom}
          onChange={changeCustom}
        />
      </fieldset>

      <footer
        data-slot="voice-picker-footer"
        className="flex items-center justify-between gap-3"
      >
        <Button
          variant="ghost"
          size={compact ? "small" : undefined}
          onClick={onSkip}
          disabled={isSubmitting}
        >
          {t("Skip for now", "暂时跳过")}
        </Button>
        <Button
          variant="primary"
          size={compact ? "small" : undefined}
          onClick={submit}
          disabled={!canSubmit}
          loading={isSubmitting}
        >
          {t("Use this voice", "使用此风格")}
        </Button>
      </footer>
    </div>
  );
}
