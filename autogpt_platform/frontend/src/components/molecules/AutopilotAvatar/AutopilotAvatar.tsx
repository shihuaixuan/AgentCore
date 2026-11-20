"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AUTOPILOT_AVATAR_URL, AUTOPILOT_NAME } from "./helpers";

interface Props {
  size?: number;
  transparent?: boolean;
  className?: string;
}

export function AutopilotAvatar({
  size = 24,
  transparent = false,
  className,
}: Props) {
  const { t } = useTranslation();
  return (
    <Image
      src={AUTOPILOT_AVATAR_URL}
      alt={t(
        `${AUTOPILOT_NAME}, your personal Head of AI`,
        `${AUTOPILOT_NAME}，你的专属 AI 负责人`,
      )}
      width={size}
      height={size}
      sizes={`${size}px`}
      data-slot="autopilot-avatar"
      className={cn(
        "shrink-0 object-contain",
        !transparent && "rounded-xl",
        className,
      )}
    />
  );
}
