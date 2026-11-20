"use client";

import { BRAND_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  className?: string;
  alt?: string;
  priority?: boolean;
};

export function AutoGPTLogo({ className, alt, priority }: Props) {
  const { t } = useTranslation();

  return (
    <Image
      src="/duanmu-icon.png"
      alt={alt ?? t(`${BRAND_NAME.en} logo`, `${BRAND_NAME.zh}标志`)}
      width={512}
      height={512}
      sizes="80px"
      className={cn("object-contain", className ?? "size-10")}
      data-slot="autogpt-logo"
      priority={priority}
    />
  );
}
