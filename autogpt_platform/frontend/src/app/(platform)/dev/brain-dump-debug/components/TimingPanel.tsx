import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { Timer01Icon } from "@hugeicons/core-free-icons";
import {
  BUDGET_DUMP_LENGTH,
  EXTRACT_BUDGET_MS,
  formatMs,
  TRANSCRIBE_BUDGET_MS,
} from "../helpers";
import { isOverBudget, type WaterfallStage } from "../waterfall";
import { DebugNote, DebugPanel } from "./DebugPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  stages: WaterfallStage[];
  finalizeRoundTripMs: number | null;
}

export function TimingPanel({ stages, finalizeRoundTripMs }: Props) {
  const { t } = useTranslation();
  return (
    <DebugPanel
      title={t("Timing waterfall", "耗时瀑布图")}
      description={t(
        `Budget for a ${BUDGET_DUMP_LENGTH}: transcription within ${formatMs(TRANSCRIBE_BUDGET_MS)} of pressing Done, extraction within ${formatMs(EXTRACT_BUDGET_MS)} after that.`,
        `60–90 秒语音梳理的耗时预算：点击完成后 ${formatMs(TRANSCRIBE_BUDGET_MS)} 内完成转录，之后 ${formatMs(EXTRACT_BUDGET_MS)} 内完成提取。`,
      )}
      icon={Timer01Icon}
      action={
        finalizeRoundTripMs !== null ? (
          <Badge variant="info">
            {t("finalize round-trip", "finalize 往返耗时")}{" "}
            {formatMs(finalizeRoundTripMs)}
          </Badge>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
      </div>
      <div className="mt-6">
        <DebugNote>
          {t(
            "Finalize is a single synchronous call that assembles, scans, stores, transcribes and extracts, so the round-trip above is the whole post-Done budget. Per-phase numbers come from polled status transitions and are only available while this page is open across a run.",
            "Finalize 是一次同步调用，负责组装、扫描、存储、转录与提取，因此上述往返耗时就是点击完成后的全部耗时。各阶段数据来自轮询观察到的状态变化，仅在本页保持打开并覆盖整个处理过程时可用。",
          )}
        </DebugNote>
      </div>
    </DebugPanel>
  );
}

function StageRow({ stage }: { stage: WaterfallStage }) {
  const { t } = useTranslation();
  const measured = stage.durationMs !== null;
  const exceeded = isOverBudget(stage);

  return (
    <div className="flex flex-col gap-2 rounded-large border border-border-base px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Text variant="body-medium">
            {t(stage.label, stage.labelZh ?? stage.label)}
          </Text>
          {measured ? (
            <Badge variant={exceeded ? "error" : "success"}>
              {exceeded
                ? t("over budget", "超出预算")
                : t("measured", "已测量")}
            </Badge>
          ) : (
            <Badge variant="info">{t("unmeasured", "未测量")}</Badge>
          )}
        </div>
        <Text variant="small" tone="muted" className="max-w-prose">
          {t(stage.source, stage.sourceZh ?? stage.source)}
        </Text>
      </div>
      <div className="flex shrink-0 flex-col sm:items-end">
        <Text variant="large-semibold" mono>
          {formatMs(stage.durationMs)}
        </Text>
        <Text variant="small" tone="muted">
          {stage.budgetMs === null
            ? t("no budget", "无预算")
            : t(
                `budget ${formatMs(stage.budgetMs)}`,
                `预算 ${formatMs(stage.budgetMs)}`,
              )}
        </Text>
      </div>
    </div>
  );
}
