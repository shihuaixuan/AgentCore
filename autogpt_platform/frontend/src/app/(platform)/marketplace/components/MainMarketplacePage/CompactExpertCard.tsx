import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertTopicHex } from "@/components/molecules/ExpertAvatar/colors";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import type { BrowseCategory } from "../Browse/BrowseFilters";
import { ExpertHireControl } from "../ExpertsSection/components/ExpertHireControl";

interface Props {
  expert: ExpertTemplate;
  isHired: boolean;
  categories: BrowseCategory[];
}

export function CompactExpertCard({ expert, isHired, categories }: Props) {
  const { t } = useTranslation();
  const skills = expert.bundled_skills ?? [];

  return (
    <article className="relative flex h-full flex-col gap-3 rounded-xl border border-border-base bg-surface p-4 hover:border-border-strong">
      <Link
        href={`/marketplace/experts/${expert.id}`}
        className="flex items-start gap-3 after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
      >
        <ExpertAvatar
          name={expert.name}
          avatarUrl={expert.avatar_url}
          size={44}
          backgroundColor={getExpertTopicHex({
            avatarUrl: expert.avatar_url,
            categories: expert.categories,
            role: expert.role,
          })}
        />
        <div className="min-w-0">
          <Text variant="body-medium" as="h2" className="truncate">
            {expert.name}
          </Text>
          <Text variant="small" tone="secondary" className="truncate">
            {expert.job_title || expert.role}
          </Text>
          <Text variant="small" tone="muted" className="line-clamp-2">
            {expert.tagline}
          </Text>
        </div>
        <span className="sr-only">{t("View", "查看")}</span>
      </Link>
      <div className="flex flex-wrap gap-1.5">
        {[...new Set(expert.categories ?? [])].slice(0, 3).map((value) => (
          <span
            key={value}
            className="rounded-md bg-surface-hover px-2 py-0.5 text-caption text-foreground-body"
          >
            {categories.find((category) => category.value === value)?.label ??
              value}
          </span>
        ))}
        {skills.slice(0, 2).map((skill) => (
          <Badge key={skill.id} variant="info" size="small">
            {skill.title}
          </Badge>
        ))}
      </div>
      <div className="relative mt-auto self-end">
        <ExpertHireControl expert={expert} isHired={isHired} />
      </div>
    </article>
  );
}
