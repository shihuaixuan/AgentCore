"use client";

import React, { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { OutputRenderer, OutputMetadata } from "../types";
import { downloadOutputs } from "../utils/download";
import { cn } from "@/lib/utils";
import {
  Copy01Icon,
  Download04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface OutputActionsProps {
  items: Array<{
    value: unknown;
    metadata?: OutputMetadata;
    renderer: OutputRenderer;
  }>;
  isPrimary?: boolean;
  className?: string;
}

export function OutputActions({
  items,
  isPrimary = false,
}: OutputActionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const textContents: string[] = [];

    for (const item of items) {
      const copyContent = item.renderer.getCopyContent(
        item.value,
        item.metadata,
      );
      if (
        copyContent &&
        item.renderer.isConcatenable(item.value, item.metadata)
      ) {
        // For concatenable items, extract the text
        let text: string;
        if (typeof copyContent.data === "string") {
          text = copyContent.data;
        } else if (copyContent.fallbackText) {
          text = copyContent.fallbackText;
        } else {
          continue;
        }
        textContents.push(text);
      }
    }

    if (textContents.length > 0) {
      const combinedText = textContents.join("\n\n");
      try {
        await navigator.clipboard.writeText(combinedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleDownloadAll = () => {
    downloadOutputs(items);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isPrimary ? "primary" : "ghost"}
        size={isPrimary ? "small" : "icon"}
        onClick={handleCopyAll}
        aria-label={t("Copy all text outputs", "复制所有文本输出")}
        className={cn(isPrimary ? "min-w-0" : "")}
      >
        {copied ? (
          <Icon icon={Tick02Icon} tone="success" className="size-4" />
        ) : (
          <Icon
            icon={Copy01Icon}
            tone={isPrimary ? "inverse" : "muted"}
            className="size-4"
          />
        )}
        {isPrimary && <span>{t("Copy All", "全部复制")}</span>}
      </Button>

      <Button
        variant={isPrimary ? "primary" : "ghost"}
        size={isPrimary ? "small" : "icon"}
        onClick={handleDownloadAll}
        aria-label={t("Download outputs", "下载输出内容")}
        className={cn(isPrimary ? "min-w-0" : "")}
      >
        <Icon
          icon={Download04Icon}
          tone={isPrimary ? "inverse" : "muted"}
          className="size-4"
        />
        {isPrimary && <span>{t("Download All", "全部下载")}</span>}
      </Button>
    </div>
  );
}
