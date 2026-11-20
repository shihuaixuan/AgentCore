"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { PauseIcon, PlayIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { useId } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useWorkflowsMovedWalkthrough } from "./useWorkflowsMovedWalkthrough";

type Player = ReturnType<typeof useWorkflowsMovedWalkthrough>;

export function WorkflowsMovedWalkthrough() {
  const { t } = useTranslation();
  const player = useWorkflowsMovedWalkthrough();
  const descriptionID = useId();

  return (
    <div
      ref={player.containerRef}
      className="overflow-hidden rounded-2xl border border-border-base bg-surface-muted"
    >
      <p id={descriptionID} className="sr-only">
        {t(
          `In the sidebar, open Team. Select ${AUTOPILOT_NAME}, then select the Workflows tab to find your existing workflows. Select a workflow name to see its details. Choose Setup your task to review the inputs and start or schedule a run. This video has no sound.`,
          `在侧边栏打开“团队”，选择 ${AUTOPILOT_NAME}，再选择“工作流”标签页，即可找到现有工作流。选择工作流名称查看详情。选择“设置任务”以检查输入，并立即运行或安排定时运行。此视频没有声音。`,
        )}
      </p>
      {player.playback === "failed" ? (
        <div className="flex aspect-video items-center justify-center px-8">
          <p
            ref={player.fallbackRef}
            role="status"
            tabIndex={-1}
            className="max-w-sm text-center text-body leading-relaxed text-foreground-secondary outline-none"
          >
            {t(
              `The walkthrough couldn't load. Open Team, select ${AUTOPILOT_NAME}, then choose Workflows.`,
              `无法加载演示。请打开“团队”，选择 ${AUTOPILOT_NAME}，再选择“工作流”。`,
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <video
              ref={player.videoRef}
              src="/videos/workflows-moved.mp4"
              poster="/videos/workflows-moved-poster.webp"
              aria-label={t("How to find your workflows", "如何找到工作流")}
              aria-describedby={descriptionID}
              className="block aspect-video w-full bg-surface-hover object-contain"
              muted
              playsInline
              preload="metadata"
              controls={player.hasStarted}
              onPlay={player.handlePlay}
              onPause={player.handlePause}
              onEnded={player.handleEnded}
              onError={player.handleError}
              onLoadedMetadata={player.handleMetadata}
              onDurationChange={player.handleMetadata}
            />
            <WalkthroughControl player={player} />
          </div>
          {player.playback === "blocked" && (
            <p
              role="status"
              className="border-t border-border-base px-4 py-3 text-caption leading-relaxed text-foreground-secondary"
            >
              {t(
                `The video couldn't start. Try playing it again, or open Team, select ${AUTOPILOT_NAME}, then choose Workflows.`,
                `视频无法开始播放。请重试，或打开“团队”，选择 ${AUTOPILOT_NAME}，再选择“工作流”。`,
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function WalkthroughControl({ player }: { player: Player }) {
  const { t } = useTranslation();
  const isPlaying = player.playback === "playing";
  const hasEnded = player.playback === "ended";
  const action = isPlaying ? "Pause" : hasEnded ? "Replay" : "Play";
  const chineseAction = isPlaying ? "暂停" : hasEnded ? "重播" : "播放";
  const icon = isPlaying ? PauseIcon : hasEnded ? RefreshIcon : PlayIcon;

  return (
    <>
      {!player.hasStarted && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 bottom-14 bg-foreground-base/15"
        />
      )}
      <div className="flex min-h-14 items-center border-t border-border-base/80 bg-surface px-4 py-2">
        <div className={player.hasStarted ? "pr-24" : undefined}>
          <p className="text-body font-medium text-foreground-body">
            {t("See where they live", "查看工作流的新位置")}
          </p>
          <p className="mt-0.5 text-caption text-foreground-tertiary">
            {player.durationLabel && (
              <>
                <span aria-label={t("Video duration", "视频时长")}>
                  {player.durationLabel}
                </span>
                <span aria-hidden> · </span>
              </>
            )}
            {t("No sound needed", "无需声音")}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={player.hasStarted ? "secondary" : "primary"}
        size={player.hasStarted ? "small" : "icon"}
        withTooltip={false}
        aria-label={t(`${action} walkthrough`, `${chineseAction}演示`)}
        aria-busy={player.isStarting}
        onClick={player.togglePlayback}
        className={
          player.hasStarted
            ? "absolute right-3 bottom-2.5"
            : "absolute top-[calc(50%-1.75rem)] left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 border-surface/20 bg-brand text-action-foreground shadow-xl hover:border-surface/30 hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
        }
      >
        <Icon icon={icon} size={player.hasStarted ? 14 : 26} aria-hidden />
        <span className={player.hasStarted ? undefined : "sr-only"}>
          {t(action, chineseAction)}
        </span>
      </Button>
    </>
  );
}
