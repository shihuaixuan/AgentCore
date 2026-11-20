"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { newRecipientChatHref } from "@/app/(platform)/copilot/expertSessionQuery";
import { Expert } from "@/app/api/__generated__/models/expert";
import { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getCategoryHex } from "@/components/molecules/ExpertAvatar/colors";
import { ExpertIdentityDetails } from "@/components/molecules/ExpertIdentityDetails/ExpertIdentityDetails";
import { CategoryTag } from "@/app/(platform)/marketplace/components/CategoryChip/CategoryTag";
import { ExpertTagline } from "@/components/molecules/ExpertIdentityDetails/components/ExpertTagline";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  BubbleChatIcon,
  Calendar03Icon,
  FlashIcon,
  PencilEdit02Icon,
  PlusSignIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { creditsToUsdLabel } from "@/lib/credits";
import { Flag, useGetFlag } from "@/services/feature-flags/use-get-flag";
import Link from "next/link";
import { MouseEvent } from "react";

import { ExpertCover } from "./components/ExpertCover";
import { IntegrationIcons } from "./components/IntegrationIcons";
import { SetupStatus } from "./components/SetupStatus";

import { SpendMeter } from "./components/SpendMeter";
import {
  getExpertCover,
  getExpertRosterStatus,
  getWeeklySpend,
} from "../../helpers";
import { CardStat, CardStats } from "../CardStats";
import { FireExpertDialog } from "../FireExpertDialog/FireExpertDialog";
import { FireExpertMenu } from "../FireExpertMenu/FireExpertMenu";
import { useExpertTeamCard } from "./useExpertTeamCard";

interface Props {
  expert: Expert;
  schedules: GraphExecutionJobInfo[];
  onInstallWorkflow: (expertId: string) => void;
  onEditSoul: (expertId: string) => void;
}

export function ExpertTeamCard({
  expert,
  schedules,
  onInstallWorkflow,
  onEditSoul,
}: Props) {
  const { t } = useTranslation();
  const rosterStatus = getExpertRosterStatus(expert);
  const weeklySpend = getWeeklySpend(expert);
  const cover = getExpertCover(expert);
  // The area the expert works in, in the chip the marketplace already uses.
  const topic = expert.categories?.[0];
  const {
    handleResume,
    isResuming,
    retrySetup,
    isRetryingSetup,
    isFireOpen,
    openFire,
    closeFire,
  } = useExpertTeamCard(expert);
  const isPaused = Boolean(expert.schedules_paused_at);
  const isAutoModeEnabled = useGetFlag(Flag.COPILOT_AUTO_MODE);

  function handleInstallClick() {
    onInstallWorkflow(expert.id);
  }

  function handleEditSoulClick(event: MouseEvent) {
    event.stopPropagation();
    onEditSoul(expert.id);
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-surface smooth-shadow-ring-sm">
      {/* Floated over the cover so the whole body stays one link target. */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={t("Edit Soul", "编辑设定")}
          leadingIcon={PencilEdit02Icon}
          onClick={handleEditSoulClick}
        />
        <FireExpertMenu
          expertName={expert.name}
          onFire={openFire}
          testId="expert-card-actions"
        />
      </div>

      <Link
        href={`/team/${expert.id}`}
        aria-label={t(`View ${expert.name}`, `查看 ${expert.name}`)}
        className="flex flex-1 flex-col items-center p-2 pb-4"
      >
        <ExpertCover
          color={cover.color}
          status={rosterStatus}
          art={cover.art}
        />

        <div className="flex w-full items-start gap-3 px-2">
          <span className="relative z-10 -mt-12 ml-1 block shrink-0">
            <ExpertAvatar
              name={expert.name}
              avatarUrl={expert.avatar_url}
              color={expert.color}
              backgroundColor={cover.color}
              size={88}
              // oxlint-disable-next-line design-system/no-restyle -- ExpertAvatar has no bordered variant (src/components is P9's)
              className="rounded-full border border-border-base ring-4 ring-surface"
            />
          </span>

          <div className="mt-2 flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 tabular-nums">
              <Text variant="small-medium" tone="secondary">
                {t("Budget", "预算")}
              </Text>
              <Text variant="small-medium" tone="secondary">
                {weeklySpend
                  ? `${creditsToUsdLabel(weeklySpend.spent)} / ${creditsToUsdLabel(weeklySpend.budget)}`
                  : t("No budget", "未设置预算")}
              </Text>
            </div>
            <SpendMeter
              spent={weeklySpend?.spent ?? 0}
              budget={weeklySpend?.budget ?? 1}
              muted={!weeklySpend}
            />
          </div>
        </div>

        <div className="mt-2 flex w-full flex-col items-start gap-1 px-2 pl-5 text-left">
          <ExpertIdentityDetails
            name={expert.name}
            role={expert.role}
            jobTitle={expert.job_title}
            nameAlign="baseline"
            areaColor={getCategoryHex(topic)}
          />
          <div className="flex items-center gap-2 empty:hidden">
            {topic ? <CategoryTag category={topic} /> : null}
            {isAutoModeEnabled && expert.autopilot_mode === "unsupervised" ? (
              <Badge variant="warning" size="small">
                {t("Unsupervised", "自主执行")}
              </Badge>
            ) : null}
            <IntegrationIcons
              expertName={expert.name}
              providers={expert.credential_providers ?? []}
            />
          </div>
          <ExpertTagline tagline={expert.tagline} compact />
        </div>

        <div className="mt-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-2 pl-5">
          <CardStats>
            <CardStat
              icon={Calendar03Icon}
              label={t("Schedules", "计划")}
              singular="schedule"
              count={schedules.length}
            />
            <CardStat
              icon={SparklesIcon}
              label={t("Skills", "技能")}
              singular="skill"
              count={expert.skills.length}
            />
            <CardStat
              icon={FlashIcon}
              label={t("Workflows", "工作流")}
              singular="workflow"
              count={expert.workflows.length}
            />
          </CardStats>
        </div>
      </Link>

      <SetupStatus
        expert={expert}
        isRetrying={isRetryingSetup}
        onRetry={retrySetup}
      />

      {isPaused ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-lg bg-warning-surface px-3 py-2 ring-1 ring-warning-border ring-inset">
          <Text variant="body" tone="warning">
            {t("Schedules paused", "计划已暂停")}
          </Text>
          <Button
            variant="secondary"
            size="small"
            loading={isResuming}
            onClick={handleResume}
          >
            {t("Resume schedules", "恢复计划")}
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-4 pb-4">
        <Button
          as="NextLink"
          href={newRecipientChatHref(expert.id)}
          variant="secondary"
          size="small"
          className="flex-1"
          leadingIcon={BubbleChatIcon}
          aria-label={t(`Chat with ${expert.name}`, `与 ${expert.name} 聊天`)}
        >
          {t("Chat", "聊天")}
        </Button>
        <Button
          variant="secondary"
          size="small"
          className="flex-1"
          leadingIcon={PlusSignIcon}
          onClick={handleInstallClick}
        >
          {t("Install workflow", "安装工作流")}
        </Button>
      </div>

      <FireExpertDialog
        expertId={expert.id}
        expertName={expert.name}
        open={isFireOpen}
        onClose={closeFire}
      />
    </div>
  );
}
