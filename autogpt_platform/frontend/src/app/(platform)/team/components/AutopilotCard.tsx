"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { newRecipientChatHref } from "@/app/(platform)/copilot/expertSessionQuery";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  BubbleChatIcon,
  Calendar03Icon,
  FlashIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AUTOPILOT_BLURB } from "../helpers";
import {
  CHIP_SHAPE,
  CHIP_SIZE,
} from "@/app/(platform)/marketplace/components/CategoryChip/CategoryChip";
import { categoryTagStyle } from "@/app/(platform)/marketplace/components/CategoryChip/CategoryTag";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { AUTOPILOT_HEX } from "@/components/molecules/ExpertAvatar/colors";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { CardStat, CardStats } from "./CardStats";
import { ExpertCover } from "./ExpertTeamCard/components/ExpertCover";

const AUTOPILOT_COVER_COLOR = AUTOPILOT_HEX;

interface Props {
  skillCount: number;
  scheduleCount: number;
  workflowCount: number;
}

export function AutopilotCard({
  skillCount,
  scheduleCount,
  workflowCount,
}: Props) {
  const { t, locale } = useTranslation();
  const title = getDefaultAssistantTitle(locale);
  return (
    <section
      aria-label={title}
      className="flex flex-col overflow-hidden rounded-2xl bg-surface smooth-shadow-ring-sm"
    >
      <Link
        href="/team/autopilot"
        aria-label={t(`View ${title}`, `查看 ${title}`)}
        className="flex flex-1 flex-col items-start p-2 pb-4"
      >
        <ExpertCover color={AUTOPILOT_COVER_COLOR} status="built-in" />

        <div className="flex w-full items-start gap-3 px-2">
          <span className="relative z-10 -mt-12 ml-1 block shrink-0">
            <ExpertAvatar
              name={title}
              avatarUrl={DEFAULT_ASSISTANT_AVATAR_URL}
              size={88}
              // oxlint-disable-next-line design-system/no-restyle -- ExpertAvatar has no bordered variant (src/components is P9's)
              className="rounded-full border border-border-base ring-4 ring-surface"
            />
          </span>
        </div>

        <div className="mt-2 flex w-full flex-col items-start gap-1 px-2 pl-5 text-left">
          <Text
            variant="lead-medium"
            tone="primary"
            className="mb-1 w-full truncate"
          >
            {title}
          </Text>
          {/* Not a category, but it sits in the same row as the experts'
              topic tags and should not read as a different kind of thing. */}
          <span
            className={cn(CHIP_SHAPE, CHIP_SIZE.small, "h-[22px] max-w-full")}
            // oxlint-disable-next-line design-system/no-inline-styles -- the tag colour is per-topic data from marketplace's categoryTagStyle (P7)
            style={categoryTagStyle(AUTOPILOT_COVER_COLOR)}
          >
            <Icon icon={SparklesIcon} size={12} className="shrink-0" />
            <span className="truncate">{t("Built in", "内置")}</span>
          </span>
          <Text
            variant="body"
            tone="muted"
            className="mt-1 line-clamp-2 min-h-[2lh]"
          >
            {t(
              AUTOPILOT_BLURB,
              "你的内置通才助手，负责回答问题、运行工作流，并将任务分配给你聘用的专家。",
            )}
          </Text>
        </div>

        <div className="w-full px-2 pl-5">
          <CardStats className="mt-3 w-full">
            <CardStat
              icon={Calendar03Icon}
              label={t("Schedules", "计划")}
              singular="schedule"
              count={scheduleCount}
            />
            <CardStat
              icon={SparklesIcon}
              label={t("Skills", "技能")}
              singular="skill"
              count={skillCount}
            />
            <CardStat
              icon={FlashIcon}
              label={t("Workflows", "工作流")}
              singular="workflow"
              count={workflowCount}
            />
          </CardStats>
        </div>
      </Link>

      <div className="flex items-center gap-2 px-4 pb-4">
        <Button
          as="NextLink"
          href={newRecipientChatHref(null)}
          variant="secondary"
          size="small"
          className="flex-1"
          leadingIcon={BubbleChatIcon}
        >
          {t("Chat", "聊天")}
        </Button>
      </div>
    </section>
  );
}
