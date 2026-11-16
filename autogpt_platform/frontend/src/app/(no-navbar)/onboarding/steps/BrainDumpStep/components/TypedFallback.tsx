"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { usePromptTranslation } from "../usePromptTranslation";

import { Button } from "@/components/atoms/Button/Button";
import { FadeIn } from "@/components/atoms/FadeIn/FadeIn";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import {
  MAX_TYPED_CHARS,
  TYPED_TOO_LONG_COPY,
  typedCharsLeftHint,
} from "../helpers";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isTooLong: boolean;
  rows?: number;
  placeholder?: string;
}

const LIMIT_HINT_ID = "brain-dump-text-limit";
const DEFAULT_PLACEHOLDER =
  "What repeats every week? What would you hand off first?";

export function TypedFallback({
  value,
  onChange,
  onSubmit,
  isTooLong,
  rows = 6,
  placeholder = DEFAULT_PLACEHOLDER,
}: Props) {
  const { t } = useTranslation();
  const { translatePrompt } = usePromptTranslation();
  return (
    <FadeIn className="w-full">
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-1">
          <Input
            id="brain-dump-text"
            type="textarea"
            label={t("Your brain dump", "你的工作描述")}
            hideLabel
            rows={rows}
            placeholder={
              placeholder === DEFAULT_PLACEHOLDER
                ? t(
                    DEFAULT_PLACEHOLDER,
                    "每周有哪些重复工作？你最想先交出哪一项？",
                  )
                : translatePrompt(placeholder)
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={MAX_TYPED_CHARS}
            aria-describedby={LIMIT_HINT_ID}
            wrapperClassName="mb-0"
            autoFocus
          />
          {isTooLong ? (
            <Text
              variant="small"
              tone="danger"
              role="alert"
              id={LIMIT_HINT_ID}
              className="text-left"
            >
              {t(
                TYPED_TOO_LONG_COPY,
                "已超过 20,000 个字符的限制，请精简后重试。",
              )}
            </Text>
          ) : (
            <Text
              variant="small"
              tone="muted"
              id={LIMIT_HINT_ID}
              className="min-h-[1.125rem] text-right"
            >
              {typedCharsLeftHint(value.length) &&
                t(
                  typedCharsLeftHint(value.length) ?? "",
                  `还可输入 ${Math.max(0, MAX_TYPED_CHARS - value.length).toLocaleString("zh-CN")} 个字符`,
                )}
            </Text>
          )}
        </div>
        <Button
          size="small"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="h-10 w-56"
        >
          {t("I'm done", "我说完了")}
        </Button>
      </div>
    </FadeIn>
  );
}
