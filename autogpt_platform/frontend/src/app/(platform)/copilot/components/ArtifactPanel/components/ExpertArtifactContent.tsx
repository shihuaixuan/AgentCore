"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useGetExpert } from "@/app/api/__generated__/endpoints/experts/experts";
import { okData } from "@/app/api/helpers";
import { swatchClassFor } from "@/app/(platform)/raise/components/ColorStep/helpers";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import type { ExpertArtifact } from "../../../store";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  expert: ExpertArtifact;
}

interface SectionProps {
  title: string;
  text: string;
}

// Same section labels as the team page's soul editor (SoulDrawer), so the
// charter reads the same here as where it gets edited.
const LABEL =
  "mb-1.5 text-caption font-medium uppercase tracking-caps text-foreground-body";

function Section({ title, text }: SectionProps) {
  return (
    <section>
      <div className={LABEL}>{title}</div>
      <p className="text-body leading-relaxed whitespace-pre-line text-foreground-secondary">
        {text}
      </p>
    </section>
  );
}

const KIND_LABELS: Record<NonNullable<ExpertArtifact["kind"]>, string> = {
  hire: "Hired from the roster",
  raise: "Raised from a charter",
  update: "Charter update",
};

/** Messages saved before the applied response carried the charter only
 *  hold the summary — for those, the expert record itself fills the gaps. */
function useCharterFallback(artifact: ExpertArtifact): ExpertArtifact {
  const missing = !!artifact.id && !artifact.about && !artifact.boundaries;
  const query = useGetExpert(artifact.id ?? "", {
    query: { select: (res) => okData(res) ?? null, enabled: missing },
  });
  const record = missing ? query.data : null;
  if (!record) return artifact;
  return {
    ...artifact,
    role: artifact.role ?? record.role,
    tagline: artifact.tagline ?? record.tagline ?? null,
    about: record.identity || null,
    boundaries: record.boundaries || null,
    voicePreferences:
      artifact.voicePreferences ?? (record.voice_preferences || null),
    weeklyBudget: artifact.weeklyBudget ?? record.weekly_budget ?? null,
    avatarUrl: artifact.avatarUrl ?? record.avatar_url ?? null,
    color: artifact.color ?? (record.color || null),
  };
}

/** The whole charter of a proposed or newly created expert — the card in
 *  the chat shows one line, this is everything the model wrote for them. */
export function ExpertArtifactContent({ expert: artifact }: Props) {
  const { t } = useTranslation();
  const expert = useCharterFallback(artifact);
  const status = expert.applied
    ? t("On the team", "已加入团队")
    : t("Proposed — nothing created yet", "提案 — 尚未创建");

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <ExpertAvatar
          name={expert.name}
          avatarUrl={expert.avatarUrl}
          color={expert.color}
          size={48}
        />
        <div className="min-w-0">
          <Text
            variant="large-semibold-tight"
            tone="primary"
            className="truncate"
          >
            {expert.name}
          </Text>
          {expert.role && (
            <Text variant="body-tight" tone="muted" className="truncate">
              {expert.role}
            </Text>
          )}
        </div>
      </div>
      {expert.tagline && (
        <p className="text-body leading-relaxed text-foreground-body">
          {expert.tagline}
        </p>
      )}
      <Section title={t("Status", "状态")} text={status} />
      {expert.kind && (
        <Section
          title={t("Kind", "来源")}
          text={t(
            KIND_LABELS[expert.kind],
            {
              hire: "从专家名册聘用",
              raise: "根据专家章程培养",
              update: "更新专家章程",
            }[expert.kind],
          )}
        />
      )}
      {expert.about && (
        <Section
          title={t("Identity and personality", "身份与性格")}
          text={expert.about}
        />
      )}
      {expert.voicePreferences && (
        <Section
          title={t("Voice", "表达风格")}
          text={expert.voicePreferences}
        />
      )}
      {expert.boundaries && (
        <Section title={t("Boundaries", "行为边界")} text={expert.boundaries} />
      )}
      <Section
        title={t("Weekly budget", "每周预算")}
        text={
          expert.weeklyBudget === null
            ? t("Default", "默认")
            : t(
                `${expert.weeklyBudget} credits`,
                `${expert.weeklyBudget} 点额度`,
              )
        }
      />
      {expert.color && swatchClassFor(expert.color) && (
        <section>
          <div className={LABEL}>{t("Accent", "主题色")}</div>
          <div className="flex items-center gap-2 text-body text-foreground-secondary">
            <span
              aria-hidden="true"
              className={cn(
                "size-4 rounded-full",
                swatchClassFor(expert.color),
              )}
            />
            {expert.color}
          </div>
        </section>
      )}
      {expert.id && (
        <Section title={t("Expert ID", "专家 ID")} text={expert.id} />
      )}
    </div>
  );
}
