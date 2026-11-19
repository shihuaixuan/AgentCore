"use client";

import { AUTOPILOT_AVATAR_URL } from "@/components/molecules/AutopilotAvatar/helpers";
import { WorkCheckCard } from "@/components/organisms/FeedbackPrompts/WorkCheckCard";
import type { ToolUIPart } from "ai";
import type { ExpertIdentity } from "../../useExpertMap";
import {
  type FeedbackCardTarget,
  getWorkCheckNote,
  RATING_SCORES,
  ratingFromState,
  readFeedbackPrompt,
} from "./helpers";
import { useFeedbackCard } from "./useFeedbackCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  part: ToolUIPart;
  target: FeedbackCardTarget;
  expert?: Pick<ExpertIdentity, "name" | "avatarUrl"> | null;
}

export function WorkCheckTool({ part, target, expert }: Props) {
  const output = readFeedbackPrompt(part);
  if (!output) return null;
  return (
    <WorkCheckPrompt
      key={output.promptId}
      promptId={output.promptId}
      isFirst={output.isFirst}
      target={target}
      expert={expert}
    />
  );
}

interface PromptProps extends Omit<Props, "part"> {
  promptId: string;
  isFirst: boolean;
}

function WorkCheckPrompt({ promptId, isFirst, target, expert }: PromptProps) {
  const { t } = useTranslation();
  const card = useFeedbackCard({ kind: "work_check", promptId, target });
  if (card.isLoading || !card.state || card.state.dismissed) return null;

  return (
    <WorkCheckCard
      name={expert?.name ?? "Otto"}
      avatarUrl={expert ? expert.avatarUrl : AUTOPILOT_AVATAR_URL}
      note={getWorkCheckNote(isFirst, t)}
      initialRating={ratingFromState(card.state)}
      initialSent={card.state.answered}
      onRate={(rating) => card.rate(RATING_SCORES[rating])}
      onReason={card.pickReason}
      onSubmit={card.submit}
      onDismiss={card.dismiss}
    />
  );
}
