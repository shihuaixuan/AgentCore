"use client";

import { useToast } from "@/components/molecules/Toast/use-toast";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { trackTourCtaClick } from "../../tracking";
import { buildTourShareUrl } from "./helpers";

const COPIED_RESET_MS = 2000;

export function useTourChatHeader() {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  async function handleShare() {
    trackTourCtaClick("share");
    const copied = await copyTextToClipboard(buildTourShareUrl());
    if (!copied) {
      toast({
        title: t("Couldn't copy the link", "无法复制链接"),
        description: buildTourShareUrl(),
        variant: "destructive",
      });
      return;
    }
    setIsCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return { isCopied, handleShare };
}
