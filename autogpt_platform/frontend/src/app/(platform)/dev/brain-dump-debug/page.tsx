"use client";

import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { notFound } from "next/navigation";
import { RecordingStatePanel } from "./components/RecordingStatePanel";
import { ServerStatusPanel } from "./components/ServerStatusPanel";
import { TimingPanel } from "./components/TimingPanel";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { UploadQueuePanel } from "./components/UploadQueuePanel";
import { isProductionEnvironment } from "./helpers";
import { useBrainDumpDebugPage } from "./useBrainDumpDebugPage";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const MAIN_CLASS = "container flex min-h-screen flex-col gap-6 pb-20 pt-16";

export default function BrainDumpDebugPage() {
  const { t } = useTranslation();
  const isProduction = isProductionEnvironment();

  const isAvailable = !isProduction;
  const { snapshot, refreshSnapshot, timeline, finalize, introPath, stages } =
    useBrainDumpDebugPage({ enabled: isAvailable });

  if (isProduction) notFound();

  return (
    <main className={MAIN_CLASS}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Text variant="h3">{t("Brain dump debug", "语音梳理调试")}</Text>
          <Badge variant="error">{t("dev only", "仅限开发环境")}</Badge>
          {introPath ? (
            <Badge variant="info">
              {t("intro path", "引导路径")} {introPath}
            </Badge>
          ) : null}
        </div>
        <Text variant="body" tone="secondary" className="max-w-prose">
          {t(
            "Local recording state, the upload queue, the server pipeline and the processing budget for the onboarding brain dump. Not reachable in production.",
            "查看入门语音梳理的本地录音状态、上传队列、服务端处理流水线与耗时预算。生产环境不可访问。",
          )}
        </Text>
      </header>

      <RecordingStatePanel snapshot={snapshot} onRefresh={refreshSnapshot} />
      <UploadQueuePanel snapshot={snapshot} />
      <ServerStatusPanel
        dump={timeline.dump}
        isLoading={timeline.isLoading}
        isError={timeline.isError}
        finalizeResponse={finalize.response}
        finalizeRoundTripMs={finalize.roundTripMs}
        finalizeError={finalize.errorMessage}
        canFinalize={finalize.canRun}
        isFinalizing={finalize.isRunning}
        onFinalize={finalize.run}
      />
      <TranscriptPanel finalizeResponse={finalize.response} />
      <TimingPanel stages={stages} finalizeRoundTripMs={finalize.roundTripMs} />
    </main>
  );
}
