"use client";

import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  AUTOPILOT_AVATAR_URL,
  AUTOPILOT_NAME,
  AUTOPILOT_TRANSPARENT_AVATAR_URL,
} from "./helpers";

interface Props {
  size?: number;
  transparent?: boolean;
  className?: string;
  backgroundColor?: string;
}

export function AutopilotAvatar({
  size = 24,
  transparent = false,
  className,
  backgroundColor,
}: Props) {
  const { t } = useTranslation();
  if (transparent) {
    return (
      <Image
        src={AUTOPILOT_TRANSPARENT_AVATAR_URL}
        alt={t(
          `${AUTOPILOT_NAME}, your personal Head of AI`,
          `${AUTOPILOT_NAME}，你的专属 AI 负责人`,
        )}
        width={size}
        height={size}
        sizes={`${size}px`}
        data-slot="autopilot-avatar"
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <ExpertAvatar
      name={AUTOPILOT_NAME}
      avatarUrl={AUTOPILOT_AVATAR_URL}
      size={size}
      backgroundColor={backgroundColor}
      className={className}
    />
  );
}
