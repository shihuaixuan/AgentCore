import type { BrainDumpStatus } from "@/app/api/__generated__/models/brainDumpStatus";
import type { IntroPath } from "@/services/onboarding/brain-dump-handoff";
import {
  EXTRACT_BUDGET_MS,
  TRANSCRIBE_BUDGET_MS,
  type RecordingSnapshot,
} from "./helpers";

export type StatusSeenAt = Partial<Record<BrainDumpStatus, number>>;

export interface WaterfallStage {
  id: string;
  label: string;
  durationMs: number | null;
  budgetMs: number | null;
  source: string;
  labelZh?: string;
  sourceZh?: string;
}

interface Args {
  snapshot: RecordingSnapshot;
  seenAt: StatusSeenAt;
  introPath: IntroPath | null;
}

export function buildWaterfall({ snapshot, seenAt, introPath }: Args) {
  return [
    recordStage(snapshot),
    uploadStage(snapshot),
    transcribeStage(seenAt),
    extractStage(seenAt),
    introStage(introPath),
  ];
}

export function isOverBudget(stage: WaterfallStage) {
  return stage.durationMs !== null && stage.budgetMs !== null
    ? stage.durationMs > stage.budgetMs
    : false;
}

function recordStage(snapshot: RecordingSnapshot): WaterfallStage {
  const firstSavedAt = snapshot.parts.at(0)?.savedAt ?? null;
  const lastSavedAt = snapshot.parts.at(-1)?.savedAt ?? null;
  const startedAt = snapshot.meta?.startedAt ?? firstSavedAt;
  const durationMs =
    startedAt !== null && lastSavedAt !== null ? lastSavedAt - startedAt : null;

  return {
    id: "record",
    label: "Record",
    labelZh: "录音",
    durationMs,
    budgetMs: null,
    source:
      durationMs === null
        ? "Unmeasured — no recording currently in IndexedDB."
        : "Measured from IndexedDB: meta.startedAt → savedAt of the last part.",
    sourceZh:
      durationMs === null
        ? "未测量 — 当前 IndexedDB 中没有录音。"
        : "根据 IndexedDB 测量：meta.startedAt → 最后一个分片的 savedAt。",
  };
}

function uploadStage(snapshot: RecordingSnapshot): WaterfallStage {
  return {
    id: "upload",
    label: "Upload",
    labelZh: "上传",
    durationMs: null,
    budgetMs: null,
    source:
      "Unmeasured — RecordingPart records `uploaded` as a boolean with no " +
      "`uploadedAt`, so per-part upload latency cannot be derived. " +
      `${snapshot.pendingUploads} of ${snapshot.parts.length} part(s) are still not marked uploaded.`,
    sourceZh: `未测量 — RecordingPart 仅将 uploaded 记录为布尔值，没有 uploadedAt，因此无法推算每个分片的上传耗时。共 ${snapshot.parts.length} 个分片，其中 ${snapshot.pendingUploads} 个尚未标记为已上传。`,
  };
}

function transcribeStage(seenAt: StatusSeenAt): WaterfallStage {
  const startedAt = firstSeen(seenAt, ["recording_uploaded", "transcribing"]);
  const endedAt = firstSeen(seenAt, ["transcribed", "extracting", "completed"]);
  return {
    id: "transcribe",
    label: "Transcribe",
    labelZh: "转录",
    durationMs: span(startedAt, endedAt),
    budgetMs: TRANSCRIBE_BUDGET_MS,
    source: transitionSource(
      startedAt,
      endedAt,
      "recording_uploaded/transcribing",
      "transcribed",
    ),
    sourceZh: transitionSourceZh(
      startedAt,
      endedAt,
      "recording_uploaded/transcribing",
      "transcribed",
    ),
  };
}

function extractStage(seenAt: StatusSeenAt): WaterfallStage {
  const startedAt = firstSeen(seenAt, ["transcribed", "extracting"]);
  const endedAt = firstSeen(seenAt, ["completed"]);
  return {
    id: "extract",
    label: "Extract",
    labelZh: "提取",
    durationMs: span(startedAt, endedAt),
    budgetMs: EXTRACT_BUDGET_MS,
    source: transitionSource(
      startedAt,
      endedAt,
      "transcribed/extracting",
      "completed",
    ),
    sourceZh: transitionSourceZh(
      startedAt,
      endedAt,
      "transcribed/extracting",
      "completed",
    ),
  };
}

function introStage(introPath: IntroPath | null): WaterfallStage {
  return {
    id: "intro",
    label: "Intro message",
    labelZh: "开场消息",
    durationMs: null,
    budgetMs: null,
    source: introPath
      ? `Unmeasured — the intro turn is composed on the copilot home after handoff. Pending handoff path: ${introPath}.`
      : "Unmeasured — no intro handoff in sessionStorage (autogpt:onboarding-intro-path), and no endpoint reports intro latency.",
    sourceZh: introPath
      ? `未测量 — 交接后将在助手首页生成开场消息。待交接路径：${introPath}。`
      : "未测量 — sessionStorage（autogpt:onboarding-intro-path）中没有开场消息交接记录，也没有接口报告开场消息耗时。",
  };
}

function firstSeen(seenAt: StatusSeenAt, statuses: BrainDumpStatus[]) {
  const times = statuses
    .map((status) => seenAt[status])
    .filter((time): time is number => time !== undefined);
  return times.length > 0 ? Math.min(...times) : null;
}

function span(startedAt: number | null, endedAt: number | null) {
  return startedAt !== null && endedAt !== null && endedAt >= startedAt
    ? endedAt - startedAt
    : null;
}

function transitionSource(
  startedAt: number | null,
  endedAt: number | null,
  from: string,
  to: string,
) {
  if (startedAt !== null && endedAt !== null) {
    return `Measured from polled status transitions: first "${from}" → first "${to}" (1s poll resolution).`;
  }
  return `Unmeasured — this page did not observe both the "${from}" and "${to}" statuses while polling. Keep it open across a finalize to capture them.`;
}

function transitionSourceZh(
  startedAt: number | null,
  endedAt: number | null,
  from: string,
  to: string,
) {
  if (startedAt !== null && endedAt !== null) {
    return `根据轮询状态变化测量：首次出现 "${from}" → 首次出现 "${to}"（轮询精度为 1 秒）。`;
  }
  return `未测量 — 本页轮询时未同时观察到 "${from}" 和 "${to}" 状态。请在整个 finalize 过程中保持本页打开以采集数据。`;
}
