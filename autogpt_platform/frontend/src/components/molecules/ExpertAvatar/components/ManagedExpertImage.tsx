"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  name: string;
  base: string;
  pixels: number;
  /** Largest PNG the library ships; WebP goes to 2x of every size. */
  pngMaxPixels?: number;
  size: number;
  isOtto: boolean;
  portrait?: string;
  className?: string;
}

export function ManagedExpertImage({
  name,
  base,
  pixels,
  pngMaxPixels = 1024,
  size,
  isOtto,
  portrait,
  className,
}: Props) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<"portrait" | "webp" | "png" | null>(
    portrait ? "portrait" : "webp",
  );
  const label = isOtto
    ? t(
        `${AUTOPILOT_NAME}, your personal Head of AI`,
        `${AUTOPILOT_NAME}，你的专属 AI 负责人`,
      )
    : t(`${name}, AI Expert`, `${name}，AI 专家`);
  const classes = cn(
    "inline-flex shrink-0 overflow-hidden rounded-xl",
    className,
    "size-(--avatar-size)",
  );
  const sizeStyle = { "--avatar-size": `${size}px` } as CSSProperties;

  if (format === "portrait" && portrait) {
    return (
      <picture data-slot="expert-avatar" className={classes} style={sizeStyle}>
        <Image
          src={portrait}
          alt={label}
          width={size}
          height={size}
          unoptimized
          data-slot="expert-avatar-image"
          className="h-full w-full object-cover"
          onError={() => setFormat("webp")}
        />
      </picture>
    );
  }

  if (!format) {
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
    <picture data-slot="expert-avatar" className={classes} style={sizeStyle}>
      <source
        data-slot="expert-avatar-source"
        type={`image/${format}`}
        srcSet={
          format === "png" && pixels * 2 > pngMaxPixels
            ? `${base}/${pixels}.png 1x`
            : `${base}/${pixels}.${format} 1x, ${base}/${pixels * 2}.${format} 2x`
        }
      />
      <Image
        src={`${base}/${pixels}.${format}`}
        alt={label}
        width={size}
        height={size}
        unoptimized
        data-slot="expert-avatar-image"
        className="h-full w-full object-contain"
        onError={() => setFormat(format === "webp" ? "png" : null)}
      />
    </picture>
  );
}
