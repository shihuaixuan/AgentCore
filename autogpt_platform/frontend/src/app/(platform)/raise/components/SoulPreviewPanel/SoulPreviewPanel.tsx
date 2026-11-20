"use client";

import { GlassOrb } from "@/components/molecules/GlassOrb/GlassOrb";
import { DEFAULT_GLASS_PARAMS } from "@/components/molecules/GlassOrb/GlassSurface";
import Image from "next/image";
import { resolveExpertAvatarUrl } from "@/components/molecules/ExpertAvatar/helpers";
import {
  kitBudgetLabel,
  kitToolsLabel,
  type RaiseKit,
  voiceDisplayLabel,
} from "../../helpers";
import { SoulDetailCard } from "./SoulDetailCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type SoulDetail = {
  label: string;
  value: string;
};

interface Props {
  title: string;
  avatarUrl: string | null;
  color: string | null;
  about: string | null;
  voiceLabel: string | null;
  kit: RaiseKit | null;
}

// Starts as just the orb — an expert with nothing to say about itself yet.
// Answers stack beneath it, which pushes the identity card up as they land.
export function SoulPreviewPanel({
  title,
  avatarUrl,
  color,
  about,
  voiceLabel,
  kit,
}: Props) {
  const { t } = useTranslation();
  const preview = resolveExpertAvatarUrl(avatarUrl);
  const details = [
    { label: t("About", "关于"), value: about },
    {
      label: t("Voice", "声音"),
      value: voiceDisplayLabel(voiceLabel, t),
    },
    { label: t("Weekly budget", "每周预算"), value: kitBudgetLabel(kit, t) },
    { label: t("Tools", "工具"), value: kitToolsLabel(kit) },
  ].filter((detail): detail is SoulDetail => Boolean(detail.value));

  return (
    <div className="flex w-full max-w-[19rem] flex-col items-center gap-3">
      {/* oxlint-disable-next-line design-system/no-arbitrary-values -- the 32px radius has no rounded-* step in this theme (3xl is 24px) */}
      <aside className="flex w-full flex-col items-center gap-8 rounded-[2rem] border border-border-base bg-canvas px-8 py-12 shadow-2xl">
        <div className="size-28 shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image
              src={preview}
              alt={t(`${title}'s picture`, `${title} 的头像`)}
              width={112}
              height={112}
              className="size-28 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <GlassOrb params={DEFAULT_GLASS_PARAMS} showRim={false} />
          )}
        </div>

        <h2 className="max-w-full text-center text-heading-md font-semibold tracking-heading break-words text-foreground-base">
          {title}
        </h2>
      </aside>

      {details.map((detail) => (
        <SoulDetailCard
          key={detail.label}
          label={detail.label}
          value={detail.value}
          color={color}
        />
      ))}
    </div>
  );
}
