import { expect, test } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { TurnPausedCard } from "../components/TurnPausedCard/TurnPausedCard";
import {
  RunsList,
  SchedulesList,
} from "../components/WorkspaceFileCards/components/SessionActivityContent";

test("localizes the real historical pause component", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <TurnPausedCard
        data={{
          reason: "task",
          resets_at: null,
          steps: null,
          checkpoint_saved: true,
          started: true,
        }}
        pauseKey="original-pause"
        isStoredRow
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("已暂停 · 此任务已达到大小限制")).toBeDefined();
});

test("localizes activity time wrappers and fallback names while preserving schedule data", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <RunsList
        runs={[
          {
            executionId: "original-run",
            name: null,
            libraryAgentId: null,
            status: "COMPLETED",
            startedAt: null,
            href: null,
          },
        ]}
      />
      <SchedulesList
        schedules={[
          {
            scheduleId: "original-schedule",
            name: "Original English schedule",
            nextRunTime: "2027-11-18T14:30:00Z",
            isRecurring: true,
            detail: "Raw scheduled prompt",
            cron: "0 12 * * *",
            timezone: "UTC",
          },
        ]}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("工作流运行")).toBeDefined();
  expect(screen.getByText(/^下次 /)).toBeDefined();
  expect(screen.getByLabelText("已完成")).toBeDefined();
  expect(screen.getByText("Original English schedule")).toBeDefined();
  expect(screen.getByText("Raw scheduled prompt")).toBeDefined();
  expect(screen.getByText("0 12 * * *")).toBeDefined();
});
