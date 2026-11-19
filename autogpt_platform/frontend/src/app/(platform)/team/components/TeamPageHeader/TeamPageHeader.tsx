"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { TeamHeaderActions } from "../TeamHeaderActions";

interface Props {
  experts: Expert[];
}

const AVATAR_CLASS =
  // oxlint-disable-next-line design-system/no-restyle -- ExpertAvatar has no bordered variant (src/components is P9's)
  "rounded-full border border-border-base ring-2 ring-surface-muted";

// Same motion as the side panel's empty-state tiles: the outer two lean out
// and spread a little further on hover.
const POSITIONS = [
  "left-0 top-1 z-0 -rotate-6 group-hover:-translate-x-1 group-hover:-rotate-12",
  "right-0 top-1 z-0 rotate-6 group-hover:translate-x-1 group-hover:rotate-12",
];

/** The built-in assistant flanked by the first two hires, over the page title and a line on
 *  what the team is for. */
export function TeamPageHeader({ experts }: Props) {
  const { t, locale } = useTranslation();
  const flank = experts.slice(0, 2);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="group flex items-center gap-4">
        <div aria-hidden className="relative h-14 w-24 shrink-0">
          {flank.map((expert, index) => (
            <span
              key={expert.id}
              className={cn(
                "absolute transition-transform duration-300 ease-out motion-reduce:transition-none",
                POSITIONS[index],
              )}
            >
              <ExpertAvatar
                name={getExpertDisplayTitle(expert, locale)}
                avatarUrl={expert.avatar_url}
                color={expert.color}
                size={44}
                className={AVATAR_CLASS}
              />
            </span>
          ))}
          <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none">
            <ExpertAvatar
              name={getDefaultAssistantTitle(locale)}
              avatarUrl={DEFAULT_ASSISTANT_AVATAR_URL}
              size={52}
              className={AVATAR_CLASS}
            />
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text variant="h4" as="h1" tone="primary">
            {t("Team", "团队")}
          </Text>
          <Text variant="body" tone="muted">
            {t(
              "Your office assistant and hired experts, ready to work.",
              "通用办公助手和你聘用的专家已准备就绪。",
            )}
          </Text>
        </div>
      </div>
      <TeamHeaderActions />
    </div>
  );
}
