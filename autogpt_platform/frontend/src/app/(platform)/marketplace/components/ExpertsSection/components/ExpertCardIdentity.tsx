"use client";

import type { ExpertTemplate } from "@/app/api/__generated__/models/expertTemplate";
import { Text } from "@/components/atoms/Text/Text";
import { getExpertTopicHex } from "@/components/molecules/ExpertAvatar/colors";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

export function ExpertCardIdentity({ expert }: { expert: ExpertTemplate }) {
  const { locale } = useTranslation();
  const title = getExpertDisplayTitle(expert, locale);
  const tagline = expert.tagline?.trim();

  return (
    <div className="flex min-w-0 items-start gap-3">
      <ExpertAvatar
        name={title}
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
      </div>
    </div>
  );
}
