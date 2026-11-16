"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { TabIntroCard } from "@/app/(platform)/components/TabIntroCard/TabIntroCard";
import { useTabIntroCard } from "@/app/(platform)/components/TabIntroCard/useTabIntroCard";
import { GridViewIcon } from "@hugeicons/core-free-icons";

interface Props {
  canShow?: boolean;
}

// First visit to the Agents tab. The fleet is already rendered behind the
// card, so "See my agents" only has to get out of the way.
export function AgentsTabIntro({ canShow = true }: Props) {
  const { t } = useTranslation();
  const { isOpen, dismiss, takeAction } = useTabIntroCard("agents", canShow);

  return (
    <TabIntroCard
      isOpen={isOpen}
      icon={GridViewIcon}
      title={t("Your mission control.", "你的工作指挥中心。")}
      body="What's running, what's scheduled, what needs you, and what it costs — all in one place."
      cta={{
        label: t("See my workflows", "查看我的工作流"),
        onClick: () => takeAction("see_agents"),
      }}
      onDismiss={dismiss}
    />
  );
}
