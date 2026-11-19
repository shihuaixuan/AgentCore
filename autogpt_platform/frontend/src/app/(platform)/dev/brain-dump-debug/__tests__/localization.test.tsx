import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { RecordingStatePanel } from "../components/RecordingStatePanel";
import { ServerStatusPanel } from "../components/ServerStatusPanel";
import { TranscriptPanel } from "../components/TranscriptPanel";
import { UploadQueuePanel } from "../components/UploadQueuePanel";
import { TimingPanel } from "../components/TimingPanel";
import { EMPTY_SNAPSHOT } from "../helpers";
import { buildWaterfall } from "../waterfall";

describe.each([
  {
    locale: "zh-CN" as Locale,
    recording: "IndexedDB 录音状态",
    refresh: "刷新",
    queue: "上传队列",
    loading: "正在加载状态…",
    transcript: "转录与提取 JSON",
    timing: "耗时瀑布图",
  },
  {
    locale: "en" as Locale,
    recording: "IndexedDB recording state",
    refresh: "Refresh",
    queue: "Upload queue",
    loading: "Loading status…",
    transcript: "Transcript & extraction JSON",
    timing: "Timing waterfall",
  },
])(
  "$locale debug panels",
  ({ locale, recording, refresh, queue, loading, transcript, timing }) => {
    it("localizes panel controls while preserving API field names and transcript content", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <RecordingStatePanel snapshot={EMPTY_SNAPSHOT} onRefresh={vi.fn()} />
          <UploadQueuePanel snapshot={EMPTY_SNAPSHOT} />
          <ServerStatusPanel
            dump={null}
            isLoading
            isError={false}
            finalizeResponse={null}
            finalizeRoundTripMs={null}
            finalizeError={null}
            canFinalize={false}
            isFinalizing={false}
            onFinalize={vi.fn()}
          />
          <TranscriptPanel
            finalizeResponse={{
              status: "completed",
              input_mode: "voice",
              transcript_preview: "Raw English transcript",
            }}
          />
          <TimingPanel stages={[]} finalizeRoundTripMs={null} />
        </LanguageProvider>,
      );
      for (const label of [
        recording,
        queue,
        loading,
        transcript,
        timing,
        "input_mode",
        "error_code",
        "Raw English transcript",
      ]) {
        expect(screen.getByText(label)).toBeDefined();
      }
      expect(screen.getByRole("button", { name: refresh })).toBeDefined();
    });
  },
);

it("localizes timing stage descriptions without translating diagnostic identifiers", () => {
  render(
    <LanguageProvider>
      <TimingPanel
        stages={buildWaterfall({
          snapshot: EMPTY_SNAPSHOT,
          seenAt: { transcribing: 1000, transcribed: 2000 },
          introPath: null,
        })}
        finalizeRoundTripMs={null}
      />
    </LanguageProvider>,
  );
  for (const label of ["录音", "上传", "转录", "提取", "开场消息"]) {
    expect(screen.getByText(label)).toBeDefined();
  }
  expect(
    screen.getByText("未测量 — 当前 IndexedDB 中没有录音。"),
  ).toBeDefined();
  expect(
    screen.getByText(
      '根据轮询状态变化测量：首次出现 "recording_uploaded/transcribing" → 首次出现 "transcribed"（轮询精度为 1 秒）。',
    ),
  ).toBeDefined();
  expect(
    screen.getByText(/sessionStorage（autogpt:onboarding-intro-path）/),
  ).toBeDefined();
});

it("keeps English waterfall copy outside the provider without changing the input stages", () => {
  const stages = buildWaterfall({
    snapshot: EMPTY_SNAPSHOT,
    seenAt: {},
    introPath: "A",
  });
  const labels = stages.map((stage) => stage.label);
  const view = render(
    <LanguageProvider>
      <TimingPanel stages={stages} finalizeRoundTripMs={null} />
    </LanguageProvider>,
  );
  expect(screen.getByText(/待交接路径：A/)).toBeDefined();
  expect(stages.map((stage) => stage.label)).toEqual(labels);
  view.rerender(<TimingPanel stages={stages} finalizeRoundTripMs={null} />);
  expect(screen.getByText("Record")).toBeDefined();
  expect(
    screen.getByText("Unmeasured — no recording currently in IndexedDB."),
  ).toBeDefined();
});
