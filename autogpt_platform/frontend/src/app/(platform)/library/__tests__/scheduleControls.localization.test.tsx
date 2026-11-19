import {
  fireEvent,
  render,
  renderHook,
  screen,
  act,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { WeeklyPicker } from "../agents/[id]/components/NewAgentLibraryView/components/modals/ScheduleAgentModal/components/CronScheduler/WeeklyPicker";
import { YearlyPicker } from "../agents/[id]/components/NewAgentLibraryView/components/modals/ScheduleAgentModal/components/CronScheduler/YearlyPicker";
import { validateSchedule } from "../agents/[id]/components/NewAgentLibraryView/components/modals/ScheduleAgentModal/components/ModalScheduleSection/helpers";
import { useEditScheduleModal } from "../agents/[id]/components/NewAgentLibraryView/components/selected-views/SelectedScheduleView/components/EditScheduleModal/useEditScheduleModal";
import type { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { vi } from "vitest";

function chinese(_english: string, translation: string) {
  return translation;
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
    </QueryClientProvider>
  );
}

describe("localized schedule controls", () => {
  it("localizes validation and retains the English default", () => {
    expect(
      validateSchedule({ scheduleName: "", time: "25:00" }, chinese),
    ).toEqual({
      scheduleName: "请填写计划名称",
      time: "请使用 HH:MM（24 小时制）",
    });
    expect(validateSchedule({ scheduleName: "" })).toEqual({
      scheduleName: "Schedule name is required",
    });
  });

  it("localizes weekday labels without changing cron values", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <WeeklyPicker values={[]} onChange={onChange} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "周一" }));
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("localizes month labels without changing cron values", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <YearlyPicker values={[]} onChange={onChange} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "11月" }));
    expect(onChange).toHaveBeenCalledWith([11]);
  });

  it("localizes schedule editing choices and validation", () => {
    const schedule = {
      id: "exact-schedule-id",
      name: "English schedule",
      cron: "0 9 * * 1",
    } as GraphExecutionJobInfo;
    const { result } = renderHook(
      () => useEditScheduleModal("exact-graph-id", schedule),
      { wrapper },
    );
    expect(result.current.repeatOptions).toContainEqual({
      value: "weekly",
      label: "每周",
    });
    expect(result.current.dayItems).toContainEqual({
      value: "1",
      label: "周一",
    });
    act(() => {
      result.current.setName("");
      result.current.setSelectedDays([]);
    });
    act(() => result.current.handleSave());
    expect(result.current.errors).toEqual({
      scheduleName: "请填写计划名称",
      days: "请至少选择一天",
    });
  });
});
