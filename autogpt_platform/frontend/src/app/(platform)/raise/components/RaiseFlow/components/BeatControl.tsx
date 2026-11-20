"use client";

import { VoicePicker } from "@/components/organisms/VoicePicker/VoicePicker";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { BeatKey } from "../../../flowItems";
import { voiceSamplesFor } from "../../../helpers";
import type { useRaisePage } from "../../../useRaisePage";
import { AboutStep } from "../../AboutStep/AboutStep";
import { AvatarStep } from "../../AvatarStep/AvatarStep";
import { BudgetStep } from "../../BudgetStep/BudgetStep";
import { CategoryStep } from "../../CategoryStep/CategoryStep";
import { jobTitleSuggestionsFor } from "../../CategoryStep/helpers";
import {
  interactiveCardClassFor,
  selectedCardClassFor,
  textClassFor,
} from "../../ColorStep/helpers";
import { JobTitleStep } from "../../JobTitleStep/JobTitleStep";
import { MarketplaceStep } from "../../MarketplaceStep/MarketplaceStep";
import { SkillsStep } from "../../SkillsStep/SkillsStep";

interface Props {
  beat: BeatKey;
  flow: ReturnType<typeof useRaisePage>;
}

export function BeatControl({ beat, flow }: Props) {
  const { locale } = useTranslation();

  switch (beat) {
    case "category":
      return (
        <CategoryStep
          selectedCategory={flow.category}
          color={flow.color}
          onPick={flow.pickCategory}
        />
      );
    case "jobTitle":
      return (
        <JobTitleStep
          selectedTitle={flow.jobTitle}
          suggestions={jobTitleSuggestionsFor(flow.category, locale)}
          color={flow.color}
          onSubmit={flow.submitJobTitle}
          onSkip={flow.skipJobTitle}
        />
      );
    case "avatar":
      // The avatar beat only opens once the area is answered.
      if (!flow.category) return null;
      return (
        <AvatarStep
          name={flow.title}
          category={flow.category}
          color={flow.color}
          avatarUrl={flow.avatarUrl || null}
          onPick={flow.pickAvatar}
          onPreviewChange={flow.setCandidateUrl}
        />
      );
    case "about":
      return (
        <AboutStep
          submittedAbout={flow.about}
          name={flow.title}
          color={flow.color}
          onSubmit={flow.submitAbout}
          onSkip={flow.skipAbout}
        />
      );
    case "voice":
      return (
        <VoicePicker
          name={flow.title}
          samples={voiceSamplesFor(locale)}
          hideHeader
          // oxlint-disable-next-line design-system/require-static-classes -- the colour helpers return whole, static class strings from COLOR_OPTIONS
          labelClassName={textClassFor(flow.color)}
          cardColors={{
            selected: selectedCardClassFor(flow.color),
            interactive: interactiveCardClassFor(flow.color),
          }}
          onPick={flow.pickVoice}
          onSkip={flow.skipVoice}
        />
      );
    case "budget":
      return (
        <BudgetStep
          color={flow.color}
          submittedBudget={flow.budget}
          onSubmit={flow.submitBudget}
          onSkip={flow.skipBudget}
        />
      );
    case "marketplace":
      return (
        <MarketplaceStep
          name={flow.title}
          color={flow.color}
          submitted={flow.marketplace}
          isFinal={flow.isMarketplaceFinal}
          isSubmitting={flow.isSubmitting}
          onSubmit={flow.submitMarketplace}
          onSkip={flow.skipMarketplace}
        />
      );
    case "skills":
      return (
        <SkillsStep
          name={flow.title}
          color={flow.color}
          submitted={flow.skills}
          existingCount={flow.marketplace?.length ?? 0}
          isSubmitting={flow.isSubmitting}
          onSubmit={flow.submitSkills}
          onSkip={flow.skipSkills}
        />
      );
    default:
      // A new beat without a control fails to compile here rather than
      // silently rendering nothing.
      return assertUnreachable(beat);
  }
}

function assertUnreachable(beat: never): never {
  throw new Error(`No control registered for beat: ${String(beat)}`);
}
