"use client";

import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useTypewriter } from "./useTypewriter";

type Props = {
  id?: string;
  text: string;
  animate?: boolean;
  onTypingComplete?: () => void;
};

export function AutoGPTBubble({
  id,
  text,
  animate = true,
  onTypingComplete,
}: Props) {
  const { locale } = useTranslation();
  const { typed, isTyping } = useTypewriter(text, onTypingComplete, animate);
  const assistantName = getDefaultAssistantTitle(locale);

  return (
    <div
      id={id}
      className="flex max-w-[85%] flex-col gap-1.5 self-start duration-500 animate-in fade-in fill-mode-both slide-in-from-bottom-3 motion-reduce:animate-none"
    >
      <div className="flex items-end gap-2">
        <ExpertAvatar
          name={assistantName}
          avatarUrl={DEFAULT_ASSISTANT_AVATAR_URL}
          size={20}
        />
        <span className="text-body font-medium text-foreground-base">
          {assistantName}
        </span>
      </div>
      <p className="text-body-md leading-relaxed text-foreground-base">
        <span aria-hidden>{typed}</span>
        {isTyping ? (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1.05em] w-px translate-y-[0.15em] animate-pulse bg-foreground-base/70"
          />
        ) : null}
        {/* The visible text arrives a character at a time; the live region
            should announce the whole line once instead of stuttering. */}
        <span className="sr-only">{text}</span>
      </p>
    </div>
  );
}
