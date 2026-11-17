"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { useGetV2GetChatShareState } from "@/app/api/__generated__/endpoints/chat/chat";
import { Button } from "@/components/atoms/Button/Button";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { chatShareUrl } from "@/lib/share/routes";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";

interface Props {
  sessionId: string;
}

export function SharedChatNotice({ sessionId }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { data: shareState } = useGetV2GetChatShareState(sessionId, {
    query: {
      enabled: !!sessionId,
      select: (res) => (res.status === 200 ? res.data : undefined),
    },
  });

  if (!shareState?.is_shared || !shareState.share_token) return null;

  const shareUrl = chatShareUrl(shareState.share_token);

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t("Failed to copy link", "复制链接失败"),
        variant: "destructive",
      });
    }
  }

  return (
    <AttentionCard.Root
      variant="warning-outline"
      density="cozy"
      className="mb-2"
    >
      <AttentionCard.Row align="center" justify="between">
        <span className="font-medium">
          {t("This chat is shared", "此对话已共享")}
        </span>
        <Button
          size="small"
          variant="secondary"
          onClick={copyShareUrl}
          leftIcon={
            copied ? (
              <Icon icon={Tick02Icon} size={14} />
            ) : (
              <Icon icon={Copy01Icon} size={14} />
            )
          }
        >
          {copied ? t("Copied", "已复制") : t("Copy link", "复制链接")}
        </Button>
      </AttentionCard.Row>
    </AttentionCard.Root>
  );
}
