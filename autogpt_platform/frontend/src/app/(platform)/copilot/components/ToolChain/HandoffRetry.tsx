"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import NextLink from "next/link";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { possessive } from "./expertHandoff";
import { useHandoffRetry } from "./useHandoffRetry";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  title: string;
  name: string;
  expertId: string;
  onSend: (message: string) => void;
}

/** Try again, for a hand-off the backend says can be sent again, and only
 *  while nothing has reached the expert since: one copy of the task, never
 *  two. */
export function HandoffRetry({ title, name, expertId, onSend }: Props) {
  const { t } = useTranslation();
  const { asked, markAsked, known, threadId } = useHandoffRetry(expertId);
  if (asked) {
    return (
      <Text variant="body-tight" as="span" tone="muted">
        {t("Asked Otto to try again.", "已请 Otto 重试。")}
      </Text>
    );
  }
  if (!known) return null;
  if (threadId) {
    return (
      <NextLink
        href={`/copilot?sessionId=${encodeURIComponent(threadId)}`}
        className="inline-flex shrink-0 items-center gap-1 rounded text-body font-medium text-foreground-emphasis underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-none"
      >
        {t(`Open ${possessive(name)} chat`, `打开与 ${name} 的对话`)}
        <Icon
          icon={ArrowUpRight01Icon}
          size={14}
          aria-hidden
          className="rtl:-scale-x-100"
        />
      </NextLink>
    );
  }
  return (
    <Button
      variant="secondary"
      size="row"
      onClick={() => {
        markAsked();
        onSend(
          `Try handing ${title} to ${name} again. (expert_id: ${expertId})`,
        );
      }}
    >
      {t("Try again", "重试")}
    </Button>
  );
}
