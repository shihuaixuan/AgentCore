import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { useId } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ExpertIdentity } from "../../../useExpertMap";

const AVATAR_SIZE = 22;

interface Props {
  experts: ExpertIdentity[];
}

// Who is on the team on the first visit: the assistant and the experts the plan
// hired. Read-only; the walkthrough's Team step points at the sidebar.
export function YourTeamRow({ experts }: Props) {
  const { t, locale } = useTranslation();
  const labelID = useId();
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
      <Text variant="eyebrow" as="span" id={labelID}>
        {t("Your team", "你的团队")}
      </Text>
      <ul
        aria-labelledby={labelID}
        className="flex flex-wrap items-center gap-2"
      >
        <li className="flex items-center gap-1.5 rounded-full border border-border-base bg-surface py-0.5 pr-2.5 pl-0.5">
          {/* The name beside it says who it is. */}
          <span aria-hidden className="contents">
            <ExpertAvatar
              name={getDefaultAssistantTitle(locale)}
              avatarUrl={DEFAULT_ASSISTANT_AVATAR_URL}
              size={AVATAR_SIZE}
            />
          </span>
          <Text variant="small-medium" as="span" tone="primary">
            {getDefaultAssistantTitle(locale)}
          </Text>
        </li>
        {experts.map((expert) => (
          <li
            key={expert.id}
            className="flex items-center gap-1.5 rounded-full border border-border-base bg-surface py-0.5 pr-2.5 pl-0.5"
          >
            <span aria-hidden className="contents">
              <ExpertAvatar
                name={getExpertDisplayTitle(expert, locale)}
                avatarUrl={expert.avatarUrl}
                backgroundColor={expert.color ?? undefined}
                size={AVATAR_SIZE}
              />
            </span>
            <Text variant="small-medium" as="span" tone="primary">
              {getExpertDisplayTitle(expert, locale)}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
