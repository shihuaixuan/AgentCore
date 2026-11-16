"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { TabIntroCard } from "@/app/(platform)/components/TabIntroCard/TabIntroCard";
import { useTabIntroCard } from "@/app/(platform)/components/TabIntroCard/useTabIntroCard";
import { Store01Icon } from "@hugeicons/core-free-icons";
import { AGENTS_SECTION_ID, FEATURED_SECTION_ID } from "./helpers";

interface Props {
  canShow?: boolean;
}

// First visit to the Marketplace tab. The CTA lands the user on the
// hand-picked carousel rather than the top of a long page, falling back to the
// full listing on the days nothing is featured — the card promises movement,
// so it has to produce some.
export function MarketplaceTabIntro({ canShow = true }: Props) {
  const { t } = useTranslation();
  const { isOpen, dismiss, takeAction } = useTabIntroCard(
    "marketplace",
    canShow,
  );

  function browseFeatured() {
    takeAction("browse_featured");
    const target =
      document.getElementById(FEATURED_SECTION_ID) ??
      document.getElementById(AGENTS_SECTION_ID);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <TabIntroCard
      isOpen={isOpen}
      icon={Store01Icon}
      title={t("Workflows ready to work.", "工作流已准备就绪。")}
      body="Hundreds built by the community. Install one in a single click and run it today."
      cta={{
        label: t("Browse featured workflows", "浏览精选工作流"),
        onClick: browseFeatured,
      }}
      onDismiss={dismiss}
    />
  );
}
