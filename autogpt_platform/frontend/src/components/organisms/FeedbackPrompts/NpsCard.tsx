"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PromptCard } from "./components/PromptCard";
import { ThanksLine } from "./components/ThanksLine";
import { MAX_FEEDBACK_NOTE_CHARS } from "./helpers";

const SCORES = Array.from({ length: 11 }, (_, i) => i);

interface Props {
  initialScore?: number | null;
  initialSent?: boolean;
  onScore?: (score: number) => void;
  onSubmit?: (answer: { score: number; note: string }) => void;
  onDismiss?: () => void;
}

const QUESTION =
  "How likely are you to recommend AutoGPT to a friend or colleague?";

function followUpFor(
  score: number,
  t: (english: string, chinese: string) => string,
) {
  if (score >= 9) return t("What do you like most?", "你最喜欢什么？");
  if (score >= 7)
    return t("What would make it a 10?", "怎样才能让你打 10 分？");
  return t("What's the main thing we should fix?", "你最希望我们改进什么？");
}

export function NpsCard({
  initialScore = null,
  initialSent = false,
  onScore,
  onSubmit,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [score, setScore] = useState<number | null>(initialScore);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(initialSent);
  const [isOpen, setIsOpen] = useState(true);

  function pickScore(value: number) {
    setScore(value);
    onScore?.(value);
  }

  function send() {
    setSent(true);
    if (score !== null) onSubmit?.({ score, note: note.trim() });
  }

  function close() {
    setIsOpen(false);
    if (!sent) onDismiss?.();
  }

  if (!isOpen) return null;

  return (
    <PromptCard
      title={t(QUESTION, "你有多大可能向朋友或同事推荐 AutoGPT？")}
      onClose={close}
    >
      {sent ? (
        <ThanksLine />
      ) : (
        <div className="flex flex-col gap-3">
          <div
            role="group"
            aria-label={t(
              `${QUESTION} From 0 (not at all likely) to 10 (extremely likely)`,
              "你有多大可能向朋友或同事推荐 AutoGPT？ 从 0（完全不可能）到 10（非常可能）",
            )}
            className="grid grid-cols-6 gap-1 sm:flex"
          >
            {SCORES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={score === value}
                onClick={() => pickScore(value)}
                className={cn(
                  "h-8 flex-1 rounded-md border border-border-base bg-surface text-caption font-medium text-foreground-emphasis transition-colors hover:border-border-strong hover:bg-surface-muted",
                  "aria-pressed:border-action aria-pressed:bg-action aria-pressed:text-action-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <Text variant="small" tone="muted">
              {t("Not at all likely", "完全不可能")}
            </Text>
            <Text variant="small" tone="muted">
              {t("Extremely likely", "非常可能")}
            </Text>
          </div>
          {score !== null ? (
            <>
              <Text variant="body-medium" tone="primary">
                {followUpFor(score, t)}
              </Text>
              <Textarea
                maxLength={MAX_FEEDBACK_NOTE_CHARS}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label={followUpFor(score, t)}
                placeholder={t("Optional", "选填")}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button size="small" onClick={send}>
                  {t("Send", "发送")}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </PromptCard>
  );
}
