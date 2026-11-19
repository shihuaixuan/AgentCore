"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { PLATFORM_OPTIONS } from "./helpers";

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORM_OPTIONS.filter((option) => option.value !== "all").map((option) => [
    option.value.toUpperCase(),
    option.label,
  ]),
);

interface Props {
  platform: string | undefined;
}

export function PlatformBadge({ platform }: Props) {
  const { t } = useTranslation();
  if (!platform) return null;
  const key = platform.toUpperCase();
  const label = PLATFORM_LABELS[key] ?? platform;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Image
        src={`/integrations/${key.toLowerCase()}.png`}
        alt={t(`${label} icon`, `${label} 图标`)}
        width={16}
        height={16}
        className="rounded-sm"
      />
      {label}
    </span>
  );
}
