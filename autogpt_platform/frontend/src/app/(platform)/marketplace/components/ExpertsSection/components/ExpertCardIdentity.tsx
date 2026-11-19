"use client";

import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { Text } from "@/components/atoms/Text/Text";
import { getExpertTopicHex } from "@/components/molecules/ExpertAvatar/colors";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertRoleLabel } from "@/services/experts/expert-role-label";
import { MarketplaceExpertAvatar } from "./MarketplaceExpertAvatar";

export function ExpertCardIdentity({ expert }: { expert: ExpertTemplate }) {
  const { locale } = useTranslation();
  const role = expert.role.trim();
  const name = expert.name.trim();
  const title =
    expert.job_title?.trim() ||
    (role && getExpertRoleLabel(role, locale)) ||
    name;
  const tagline = expert.tagline?.trim();

  return (
    <div className="flex min-w-0 items-start gap-3">
      <MarketplaceExpertAvatar
        name={name}
        avatarUrl={expert.avatar_url}
        size={48}
        backgroundColor={getExpertTopicHex({
          avatarUrl: expert.avatar_url,
          categories: expert.categories,
          role: expert.role,
        })}
      />
      <div className="min-w-0">
        <Text
          as="h2"
          variant="body-medium"
          weight="semibold"
          className="break-words"
        >
          {title}
        </Text>
        {tagline ? (
          <Text variant="small" tone="secondary" className="line-clamp-2">
            {tagline}
          </Text>
        ) : null}
        {name !== title ? (
          <Text variant="small" tone="muted" className="truncate">
            {name}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
