"use client";

import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";
import { AmbientPrompts } from "./components/AmbientPrompts";
import { FailureState } from "./components/FailureState";
import { IdeasPauseToggle } from "./components/IdeasPauseToggle";
import { InsufficientState } from "./components/InsufficientState";
import { MicButton, OrbScreen } from "./components/MicButton";
import { ModeSwitchLink } from "./components/ModeSwitchLink";
import { OttoMightAsk } from "./components/OttoMightAsk";
import { PrivacyNote } from "./components/PrivacyNote";
import { RecordingControls } from "./components/RecordingControls/RecordingControls";
import { RecoveryPrompt } from "./components/RecoveryPrompt";
import { RestActions } from "./components/RestActions";
import { RevealGroup, RevealItem } from "@/components/atoms/Reveal/Reveal";
import { SkipButton } from "./components/SkipButton";
import { StepHeader } from "./components/StepHeader";
import { TypingComposer } from "./components/TypingComposer";
import { OrbControlButton } from "./components/OrbControlButton";
import { useEffect, useState } from "react";
import { recordingSupport, toOrbScreen } from "./helpers";
import { useBrainDumpStep } from "./useBrainDumpStep";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const MIC_UNAVAILABLE_COPY =
  "We couldn't open your microphone. You can write it instead.";
const TIME_LIMIT_CAPTION =
  "That's 30 minutes, the most we record in one go. Saving all of it…";

export function BrainDumpStep() {
  const { t } = useTranslation();
  const dump = useBrainDumpStep();
  const [captureIssue, setCaptureIssue] =
    useState<ReturnType<typeof recordingSupport>["issue"]>(null);
  useEffect(() => {
    setCaptureIssue(recordingSupport().issue);
  }, []);
  const isRecording = dump.screen === "recording";
  const isProcessing = dump.screen === "processing";
  const isTyping = dump.screen === "typing";
  const showPrivacyNote =
    dump.screen !== "failed" &&
    dump.screen !== "recovery" &&
    dump.screen !== "insufficient";
  // rest → recording → processing all share one orb, so it is never
  // unmounted between them: only the glyph and the ring change.
  const orbScreen = toOrbScreen(dump.screen);

  function orbClick(screen: OrbScreen) {
    if (screen === "processing") return undefined;
    if (screen === "failed") return dump.handleRetry;
    return screen === "rest" ? dump.handleStart : undefined;
  }

  function showAnotherQuestion() {
    dump.prompt.advance("click");
  }

  return (
    <>
      <SkipButton
        isHidden={isRecording}
        isProcessing={isProcessing}
        onSkip={dump.handleSkip}
      />

      {/* Wide enough that the starter ideas clear the typing composer. */}
      <div className="relative flex w-full max-w-screen-2xl flex-col items-center justify-center self-stretch">
        <IdeasPauseToggle
          screen={dump.screen}
          isPaused={dump.prompt.isPaused}
          onToggle={dump.prompt.togglePause}
        />
        <AmbientPrompts
          role={dump.role}
          screen={dump.screen}
          isPaused={dump.prompt.isPaused}
          onTogglePause={dump.prompt.togglePause}
        />
        <RevealGroup
          className={cn(
            // oxlint-disable-next-line design-system/no-restyle -- RevealGroup/RevealItem are motion wrappers that lay out their children; a wrapper div would split the stagger
            "relative z-10 flex w-full flex-col items-center gap-6 px-4",
            isTyping
              ? // oxlint-disable-next-line design-system/no-restyle -- see above
                "w-[calc(100vw-3rem)] max-w-3xl [@media(max-height:800px)]:gap-4"
              : "max-w-2xl",
          )}
        >
          <StepHeader
            screen={dump.screen}
            restHeadline={dump.headline}
            isFollowUp={dump.isFollowUp}
            elapsedSeconds={dump.elapsedSeconds}
            question={dump.prompt.question.text}
            onTogglePause={dump.prompt.togglePause}
          />

          {orbScreen && (
            <RevealItem
              blur={false}
              className={cn(
                // oxlint-disable-next-line design-system/no-restyle -- RevealGroup/RevealItem are motion wrappers that lay out their children; a wrapper div would split the stagger
                "flex w-full flex-col items-center gap-4",
                // oxlint-disable-next-line design-system/no-restyle -- see above
                isTyping && "[@media(max-height:800px)]:gap-2",
              )}
            >
              <MicButton screen={orbScreen} audioStream={dump.audioStream} />
              <div className="flex w-full flex-col items-center">
                {isTyping ? (
                  <TypingComposer
                    value={dump.typedText}
                    onChange={dump.setTypedText}
                    isTooLong={dump.isTypedTooLong}
                    onSubmit={dump.handleSubmitTyped}
                    placeholder={dump.typingPlaceholder}
                    question={dump.prompt.question.text}
                    announcement={dump.prompt.announcement}
                    onAnotherQuestion={showAnotherQuestion}
                    onTogglePause={dump.prompt.togglePause}
                    isMicBlocked={dump.isMicBlocked}
                    isMicUnavailable={dump.isMicUnavailable}
                    micPermission={dump.micPermission}
                    onRetryMicrophone={dump.handleRetryMicrophone}
                  />
                ) : isRecording ? (
                  <>
                    <OttoMightAsk
                      question={dump.prompt.question.text}
                      onAnother={showAnotherQuestion}
                      announcement={dump.prompt.announcement}
                      onTogglePause={dump.prompt.togglePause}
                    />
                    <RecordingControls
                      onStop={dump.handleStop}
                      onSend={dump.handleDone}
                      onRetry={dump.handleRestart}
                      elapsedSeconds={dump.elapsedSeconds}
                      showSilenceNudge={dump.showSilenceNudge}
                      isOffline={dump.isOffline}
                    />
                  </>
                ) : orbScreen === "rest" ? (
                  <>
                    <RestActions
                      onTalk={captureIssue ? undefined : dump.handleStart}
                      onWrite={dump.showTyping}
                      writeFirst={
                        Boolean(captureIssue) || dump.isMicUnavailable
                      }
                    />
                    {(captureIssue || dump.isMicUnavailable) && (
                      <Text
                        variant="body"
                        tone="muted"
                        role="alert"
                        className="mt-3 text-center"
                      >
                        {captureIssue === "insecure"
                          ? t(
                              "To record, open this page over HTTPS (or localhost on this device). You can write here instead.",
                              "如需录音，请通过 HTTPS 打开此页面（本机也可使用 localhost）。你也可以直接输入文字。",
                            )
                          : captureIssue === "unsupported"
                            ? t(
                                "This browser doesn't support recording here. You can write instead or try another browser.",
                                "当前浏览器不支持录音。你可以改用文字输入，或换一个浏览器。",
                              )
                            : t(
                                MIC_UNAVAILABLE_COPY,
                                "无法打开麦克风，你可以改用文字输入。",
                              )}
                      </Text>
                    )}
                  </>
                ) : (
                  orbScreen === "failed" && (
                    <OrbControlButton
                      screen={orbScreen}
                      onClick={orbClick(orbScreen)}
                    />
                  )
                )}
              </div>
              {isProcessing && (
                <Text variant="body" tone="muted" className="text-center">
                  {dump.reachedTimeLimit
                    ? t(
                        TIME_LIMIT_CAPTION,
                        "已达到单次录音的 30 分钟上限，正在保存全部内容…",
                      )
                    : t("Got it. One second…", "收到了，请稍等…")}
                </Text>
              )}
            </RevealItem>
          )}

          {dump.screen === "recovery" && dump.recoverable && (
            <RevealItem>
              <RecoveryPrompt
                durationSecs={dump.recoverable.durationSecs}
                onResume={dump.handleResumeRecovered}
                onDownload={dump.handleDownloadRecording}
                onDiscard={dump.handleDiscardRecovered}
              />
            </RevealItem>
          )}

          {dump.screen === "failed" && (
            <RevealItem>
              <FailureState
                mode={dump.submittedMode}
                reason={dump.failureReason}
                onDownload={dump.handleDownloadRecording}
                onSkip={dump.handleSkip}
              />
            </RevealItem>
          )}

          {dump.screen === "insufficient" && (
            <RevealItem>
              <InsufficientState
                mode={dump.insufficientMode}
                heardText={dump.heardText}
                replyKind={dump.replyKind}
                role={dump.role}
                canRecord={!captureIssue && !dump.isMicBlocked}
                onTalk={dump.handleRestart}
                onWrite={dump.showTyping}
                onSkip={dump.handleSkip}
              />
            </RevealItem>
          )}

          {(!isTyping || !captureIssue) && (
            <ModeSwitchLink
              screen={dump.screen}
              submittedMode={dump.submittedMode}
              onTypeInstead={dump.showTyping}
              onRecordInstead={dump.handleRecordInstead}
              onTypeInsteadOfRecovered={dump.handleTypeInsteadOfRecovered}
            />
          )}

          {showPrivacyNote && !isRecording && <PrivacyNote />}
        </RevealGroup>
      </div>
    </>
  );
}
