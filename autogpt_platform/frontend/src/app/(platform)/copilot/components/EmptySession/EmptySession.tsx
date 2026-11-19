"use client";

import { ChatInput } from "@/app/(platform)/copilot/components/ChatInput/ChatInput";
import { HomeRecap } from "@/app/(platform)/home/components/HomeRecap/HomeRecap";
import { tourTarget } from "@/lib/tour-targets";
import { useFirstRunTourAutoStart } from "@/app/(platform)/components/FirstRunTour/useFirstRunTourAutoStart";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import type { WorkspaceAttachment } from "../../helpers/workspaceAttachments";
import { newTaskDraftKey } from "../ChatInput/components/recipientOptions";
import { OnboardingIntroCard } from "../OnboardingIntroCard/OnboardingIntroCard";
import { useOnboardingIntroCard } from "../OnboardingIntroCard/useOnboardingIntroCard";
import { SEND_AT_RESET_PLACEHOLDER } from "../SendAtReset/helpers";
import { SuggestedTasksBlock } from "../SuggestedTasks/SuggestedTasksBlock";
import { useCollapsedSuggestions } from "../SuggestedTasks/useCollapsedSuggestions";
import { useSuggestedTasks } from "../SuggestedTasks/useSuggestedTasks";
import { EmptyHero } from "./components/EmptyHero";
import { ExpertKickoffLoader } from "./components/ExpertKickoffLoader/ExpertKickoffLoader";
import { GreetingLoader } from "./components/GreetingLoader";
import { getExpertInputPlaceholder, getGreetingName } from "./helpers";
import { useHomeComposer } from "./useHomeComposer";
import { useRecipientPicker } from "./useRecipientPicker";

interface Props {
  isCreatingSession: boolean;
  onCreateSession: () => void | Promise<string>;
  onSend: (
    message: string,
    files?: File[],
    workspaceFiles?: WorkspaceAttachment[],
  ) => void | Promise<void>;
  /** Sends a suggested task, resolving to the chat it started. */
  onStartTask?: (message: string) => Promise<string | undefined>;
  isUploadingFiles?: boolean;
  droppedFiles?: File[];
  onDroppedFilesConsumed?: () => void;
  isInteractionLocked?: boolean;
  isKickoffStarting?: boolean;
  expertName?: string;
  /** Expert the new conversation will address; scopes workspace-file pickers. */
  expertId?: string | null;
  /** Starts voice mode from the + menu. Absent when the flag is off. */
  voiceMode?: ComponentProps<typeof ChatInput>["voiceMode"];
  /** The chat's approval-mode selector. Absent when the flag is off. */
  modeSelector?: ReactNode;
  /** Out of AutoPilot budget with a reset ahead: the composer sets the new
   *  chat's first message to send at the reset. */
  atReset?: ComponentProps<typeof ChatInput>["atReset"];
  /** Shown above the composer while sending is paused. */
  usageNotice?: ReactNode;
  /** The running-low hint, shown under the composer. */
  lowHint?: ReactNode;
}

export function EmptySession({
  isCreatingSession,
  onSend,
  onStartTask,
  isUploadingFiles,
  droppedFiles,
  onDroppedFilesConsumed,
  isInteractionLocked,
  isKickoffStarting,
  expertName,
  expertId = null,
  voiceMode,
  modeSelector,
  atReset,
  usageNotice,
  lowHint,
}: Props) {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const greetingName = getGreetingName(user);
  const intro = useOnboardingIntroCard();
  useFirstRunTourAutoStart({
    isPending: intro.isFirstRunPending,
    onFinished: intro.finishFirstRun,
  });

  const {
    options,
    experts,
    expertsById,
    isRosterLoaded,
    hasRosterFailed,
    recipient,
    selectedExpert,
    isLoadingRecipient,
    selectRecipient,
  } = useRecipientPicker();
  const isComposerDisabled = isCreatingSession || !!isInteractionLocked;
  const suggestions = useSuggestedTasks({
    surface: intro.isVisible ? "intro" : "home",
    onSend: onStartTask ?? onSend,
    enabled: !intro.isAwaitingGreeting,
    experts,
    expertsById,
    isRosterLoaded,
    hasRosterFailed,
    recipientID: recipient?.id ?? null,
    selectRecipient,
    // A task starts its own chat only through onStartTask, which the page
    // withholds while it resolves the recipient or the turn is locked.
    canSend: Boolean(onStartTask) && !isComposerDisabled,
    isRecipientResolving: isLoadingRecipient,
  });
  const collapse = useCollapsedSuggestions();
  const profession = selectedExpert
    ? getExpertDisplayTitle(selectedExpert, locale)
    : null;
  const introLine = isLoadingRecipient
    ? null
    : profession
      ? t(
          `How can I help as your ${profession}?`,
          `我是你的${profession}，你希望我处理什么？`,
        )
      : t("Describe a task to get started.", "描述一项任务，即可开始。");
  const { inputPlaceholder } = useHomeComposer({
    greetingPath: intro.isVisible ? intro.path : null,
  });

  if (isKickoffStarting) {
    return <ExpertKickoffLoader expertName={expertName} />;
  }

  return (
    <div className="relative flex h-full flex-1 items-start justify-center overflow-y-auto px-0 py-5 md:px-6 md:py-10">
      <motion.div
        className={cn("relative z-10 w-full text-center", "max-w-[1120px]")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto max-w-[52rem] pt-6">
          {intro.isVisible ? (
            <OnboardingIntroCard
              name={greetingName}
              greeting={intro.greeting}
              suggestions={suggestions}
              collapse={collapse}
              transcript={intro.transcript}
              disabled={isComposerDisabled || !!atReset}
            />
          ) : intro.isAwaitingGreeting ? (
            // For as long as the pipeline is still writing, which can be
            // behind the first-run walkthrough. The orb it renders is the same
            // element the card above puts in its heading, so the swap
            // moves it there rather than replacing it.
            <GreetingLoader />
          ) : (
            <EmptyHero name={greetingName} intro={introLine} />
          )}

          {/* Held back while the greeting is on its way — it enters with
              the greeting page instead of sitting under a bare hero. */}
          {!intro.isAwaitingGreeting && (
            <div className={cn("mb-6", intro.isVisible && "max-w-[48rem]")}>
              <div
                {...tourTarget("composer")}
                className={cn(
                  "text-left transition-colors duration-300 ease-out",
                  // The greeting's prompt card bleeds 1.25rem past the text
                  // (-mx-5); the composer stretches the same amount so their
                  // edges line up. No chrome of its own: the composer card is
                  // the only outline on screen. The regular hero keeps it
                  // centered.
                  intro.isVisible
                    ? "-mx-5 max-w-[50.5rem]"
                    : "mx-auto w-full max-w-[42rem]",
                )}
              >
                {usageNotice && (
                  <div className="mb-3 text-left">{usageNotice}</div>
                )}
                <ChatInput
                  inputId="chat-input-empty"
                  draftKey={newTaskDraftKey(recipient?.id ?? expertId)}
                  stacked
                  managedModels
                  voiceMode={voiceMode}
                  modeSelector={modeSelector}
                  onSend={onSend}
                  disabled={isComposerDisabled}
                  atReset={atReset}
                  isUploadingFiles={isUploadingFiles}
                  placeholder={
                    atReset
                      ? t(
                          SEND_AT_RESET_PLACEHOLDER,
                          "现在撰写，额度重置后自动发送……",
                        )
                      : profession
                        ? t(
                            getExpertInputPlaceholder(profession),
                            `你希望 ${profession} 处理什么？`,
                          )
                        : inputPlaceholder
                  }
                  className={cn(
                    "w-full max-md:[&_[data-slot=input-group-control]]:min-h-16",
                    "[&_textarea]:min-h-[4.5rem]",
                  )}
                  droppedFiles={droppedFiles}
                  onDroppedFilesConsumed={onDroppedFilesConsumed}
                  expertId={expertId}
                  expertName={expertName}
                  assistantName={profession ?? expertName ?? null}
                  recipientPicker={{
                    recipient,
                    options,
                    isLoading: isLoadingRecipient,
                    isRosterPending: !isRosterLoaded,
                    hasRosterFailed,
                    onSelect: selectRecipient,
                  }}
                />
                {lowHint}
              </div>
            </div>
          )}

          {/* The greeting's list once the greeting has retired. Each task
              goes to its own owner, whoever the composer is addressed to. */}
          {!intro.isVisible &&
            !intro.isAwaitingGreeting &&
            suggestions.isStored && (
              <SuggestedTasksBlock
                suggestions={suggestions}
                collapse={collapse}
                disabled={isComposerDisabled || !!atReset}
                className="mx-auto mb-6 max-w-[42rem]"
              />
            )}
        </div>

        {!intro.isVisible && !intro.isAwaitingGreeting && <HomeRecap />}
      </motion.div>
    </div>
  );
}
