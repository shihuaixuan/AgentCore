"use client";

import type { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { GlassOrb } from "@/components/molecules/GlassOrb/GlassOrb";
import { DEFAULT_GLASS_PARAMS } from "@/components/molecules/GlassOrb/GlassSurface";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { kitBudgetLabel, kitToolsLabel, type RaiseKit } from "../../helpers";
import { roleFor } from "../CategoryStep/helpers";
import { SoulDetailCard } from "./SoulDetailCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const REVEAL =
  "duration-700 animate-in fade-in slide-in-from-bottom-2 fill-mode-both motion-reduce:animate-none";

type SoulDetail = {
  label: string;
  value: string;
};

interface Props {
  name: string;
  category: ExpertAvatarRequestCategory | null;
  jobTitle?: string | null;
  avatarUrl: string | null;
  color: string | null;
  about: string | null;
  voiceLabel: string | null;
  kit: RaiseKit | null;
}

// Starts as just the orb — an expert with nothing to say about itself yet.
// Answers stack beneath it, which pushes the identity card up as they land.
export function SoulPreviewPanel({
  name,
  category,
  jobTitle,
  avatarUrl,
  color,
  about,
  voiceLabel,
  kit,
}: Props) {
  const { t } = useTranslation();
  const roles: Record<ExpertAvatarRequestCategory, string> = {
    general: "助理",
    marketing: "营销专员",
    sales: "销售",
    finance: "分析师",
    support: "客户支持",
    operations: "运营",
    research: "研究员",
    content: "作家",
    development: "开发者",
  };
  const roleLabel =
    jobTitle || (category ? t(roleFor(category) ?? "", roles[category]) : null);
  const details = [
    { label: t("About", "关于"), value: about },
    { label: t("Voice", "声音"), value: voiceLabel },
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
              src={avatarUrl}
              alt={t(
                `${name || "Your expert"}'s picture`,
                name ? `${name} 的头像` : "你的专家的头像",
              )}
              width={112}
              height={112}
              className="size-28 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <GlassOrb params={DEFAULT_GLASS_PARAMS} showRim={false} />
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h2
            className={cn(
              "text-center text-heading-md font-semibold tracking-heading",
              name
                ? `text-foreground-base ${REVEAL}`
                : "text-foreground-tertiary/50",
            )}
          >
            {name || t("No name yet", "尚未命名")}
          </h2>
          {roleLabel ? (
            <p
              className={`text-body tracking-caps text-foreground-tertiary uppercase ${REVEAL}`}
            >
              {roleLabel}
            </p>
          ) : null}
        </div>
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
