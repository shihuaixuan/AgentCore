"use client";

import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import React from "react";
import { ShowMoreTextVariant } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  children: string;
  previewLimit?: number;
  variant?: ShowMoreTextVariant;
  className?: string;
  toggleClassName?: string;
  defaultExpanded?: boolean;
}

export function ShowMoreText({
  children,
  previewLimit = 100,
  variant = "body",
  className,
  toggleClassName,
  defaultExpanded = false,
}: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const shouldTruncate = children.length > previewLimit;
  const previewText = shouldTruncate
    ? children.slice(0, previewLimit)
    : children;
  const displayText = isExpanded ? children : previewText;

  if (!shouldTruncate) {
    return (
      <Text
        variant={variant}
        data-slot="show-more-text"
        className={cn(className)}
      >
        {children}
      </Text>
    );
  }

  return (
    <Text
      variant={variant}
      data-slot="show-more-text"
      className={cn("flex flex-wrap items-center", className)}
    >
      {displayText}
      {!isExpanded && "..."}
      <button
        aria-label={
          isExpanded ? t("Show less", "收起内容") : t("Show more", "显示更多")
        }
        onClick={() => setIsExpanded(!isExpanded)}
        data-slot="show-more-text-toggle"
        className={cn(
          "mt-2 flex h-[1rem] w-[1.75rem] items-center justify-center rounded-full bg-surface-hover pb-2 font-medium text-foreground-base",
          toggleClassName,
        )}
        type="button"
      >
        ...
      </button>
    </Text>
  );
}
