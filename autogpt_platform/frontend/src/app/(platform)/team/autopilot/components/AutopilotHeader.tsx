"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { AUTOPILOT_HEX } from "@/components/molecules/ExpertAvatar/colors";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { ExpertCover } from "../../components/ExpertTeamCard/components/ExpertCover";

export function AutopilotHeader() {
  const { t, locale } = useTranslation();
  const title = getDefaultAssistantTitle(locale);
  return (
    <header>
      <ExpertCover className="h-36" color={AUTOPILOT_HEX} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ExpertAvatar
          name={title}
          avatarUrl={DEFAULT_ASSISTANT_AVATAR_URL}
          size={96}
          // oxlint-disable-next-line design-system/no-restyle -- ExpertAvatar has no bordered variant (src/components is P9's)
          className="relative z-10 -mt-12 ml-4 rounded-full border border-border-base"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Text as="h1" variant="h3" tone="primary">
              {title}
            </Text>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5 font-sans text-caption font-medium text-foreground-body">
              <Icon icon={Tick02Icon} size={12} />

              {t("Built in", "内置")}
            </span>
          </div>
        </div>
        <Button
          as="NextLink"
          href="/copilot"
          variant="primary"
          size="small"
          className="shrink-0"
        >
          {t("Chat", "聊天")}
        </Button>
      </div>
    </header>
  );
}
