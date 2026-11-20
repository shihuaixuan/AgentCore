"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  name: string;
  src: string;
  imageLabel?: string;
  size: number;
  isOtto: boolean;
  className?: string;
}

export function ManagedExpertImage({
  name,
  src,
  imageLabel,
  size,
  isOtto,
  className,
}: Props) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const label =
    imageLabel ??
    (isOtto
      ? t(
          `${AUTOPILOT_NAME}, your personal Head of AI`,
          `${AUTOPILOT_NAME}，你的专属 AI 负责人`,
        )
      : t(`${name}, AI Expert`, `${name}，AI 专家`));
  const classes = cn(
    "inline-flex shrink-0 overflow-hidden rounded-xl",
    className,
    "size-(--avatar-size)",
  );
  const sizeStyle = { "--avatar-size": `${size}px` } as CSSProperties;

  if (failed) {
    return (
      <span
        role="img"
        aria-label={label}
        data-slot="expert-avatar"
        style={sizeStyle}
        className={cn(
          classes,
          "items-center justify-center bg-surface-hover text-foreground-base",
        )}
      >
        {name.trim().slice(0, 2).toUpperCase() || "AI"}
      </span>
    );
  }

  return (
    <span data-slot="expert-avatar" className={classes} style={sizeStyle}>
      <Image
        src={src}
        alt={label}
        width={size}
        height={size}
        unoptimized
        data-slot="expert-avatar-image"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
