"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { toast } from "@/components/molecules/Toast/use-toast";
import { Link01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  url: string;
}

export function ShareLinkButton({ url }: Props) {
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: t("Link copied to clipboard", "链接已复制到剪贴板") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t("Couldn't copy link", "无法复制链接"),
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      variant="ghost"
      size="small"
      onClick={handleCopy}
      leftIcon={
        copied ? (
          <Icon icon={Tick02Icon} size={14} />
        ) : (
          <Icon icon={Link01Icon} size={14} />
        )
      }
      className="w-full sm:w-auto"
      data-testid="copy-share-link-button"
    >
      {copied ? "Copied" : t("Copy share link", "复制分享链接")}
    </Button>
  );
}
