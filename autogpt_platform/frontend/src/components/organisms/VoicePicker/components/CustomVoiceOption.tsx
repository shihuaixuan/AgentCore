"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { selectableCardClassName, type SelectableCardColors } from "../helpers";

const MAX_CUSTOM_VOICE_SAMPLE_CHARACTERS = 2_000;
const CUSTOM_VOICE_TEXTAREA_ROWS = 3;

interface Props {
  choiceGroupName: string;
  textareaId: string;
  customText: string;
  isSelected: boolean;
  labelClassName?: string;
  colors?: SelectableCardColors;
  compact?: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
}

export function CustomVoiceOption({
  choiceGroupName,
  textareaId,
  customText,
  isSelected,
  labelClassName,
  colors,
  compact = false,
  onFocus,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const characterCountId = `${textareaId}-character-count`;

  return (
    <div
      data-slot="custom-voice-option"
      className={selectableCardClassName(isSelected, false, colors, compact)}
    >
      <label
        htmlFor={`${textareaId}-choice`}
        data-slot="custom-voice-option-label"
        className={cn(
          "mb-2 block cursor-pointer text-caption font-semibold tracking-caps uppercase",
          labelClassName ?? "text-brand",
        )}
      >
        <input
          id={`${textareaId}-choice`}
          type="radio"
          name={choiceGroupName}
          value="custom"
          checked={isSelected}
          onChange={onFocus}
          data-slot="custom-voice-option-radio"
          className="sr-only"
        />
        {t("Paste your own", "粘贴自己的示例")}
      </label>
      <label
        htmlFor={textareaId}
        data-slot="custom-voice-option-textarea-label"
        className="sr-only"
      >
        {t("Custom voice sample", "自定义写作风格示例")}
      </label>
      <textarea
        id={textareaId}
        value={customText}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        rows={compact ? 2 : CUSTOM_VOICE_TEXTAREA_ROWS}
        maxLength={MAX_CUSTOM_VOICE_SAMPLE_CHARACTERS}
        aria-describedby={characterCountId}
        placeholder={t(
          "Paste a few sentences written the way you'd like this expert to sound.",
          "粘贴几句示例，展示你希望这位专家使用的写作风格。",
        )}
        data-slot="custom-voice-option-textarea"
        className={cn(
          "w-full resize-none border bg-canvas text-body leading-relaxed text-foreground-base placeholder:text-foreground-tertiary focus:ring-1 focus:ring-focus focus:outline-none",
          compact ? "rounded-md px-3 py-2" : "rounded-xl px-4 py-2.5",
          isSelected
            ? "border-focus"
            : "border-border-strong focus:border-focus",
        )}
      />
      <p
        id={characterCountId}
        data-slot="custom-voice-option-count"
        className="mt-1.5 text-right text-caption text-foreground-tertiary"
      >
        {t(
          `${customText.length.toLocaleString()} / ${MAX_CUSTOM_VOICE_SAMPLE_CHARACTERS.toLocaleString()} characters`,
          `${customText.length.toLocaleString()} / ${MAX_CUSTOM_VOICE_SAMPLE_CHARACTERS.toLocaleString()} 字符`,
        )}
      </p>
    </div>
  );
}
