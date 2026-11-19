import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentExecutionStatus } from "@/app/api/__generated__/models/agentExecutionStatus";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import {
  formatRelativeDuration,
  runningMessage,
} from "../hooks/executionHelpers";
import {
  getAgentStatusLabel,
  getEmptyMessage,
} from "../components/AgentBriefingPanel/components/BriefingTabContent/helpers";
import { formatRelativeDate } from "../components/AgentBriefingPanel/components/CostsBreakdown/helpers";
import {
  validateInputs,
  validateCredentials,
  parseCronDescription,
} from "../agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentModal/helpers";
import { buildAutoPilotPrompt } from "../components/SitrepItem/helpers";
import type { SitrepItemData } from "../types";

function chinese(_english: string, translation: string) {
  return translation;
}

describe("localized library display helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    [20_000, "几秒", "a few seconds"],
    [5 * 60_000, "5 分钟", "5m"],
    [125 * 60_000, "2 小时 5 分钟", "2h 5m"],
    [49 * 3_600_000, "2 天 1 小时", "2d 1h"],
  ])(
    "localizes duration %s and keeps the English default",
    (duration, zh, en) => {
      expect(formatRelativeDuration(duration, chinese)).toBe(zh);
      expect(formatRelativeDuration(duration)).toBe(en);
    },
  );

  it("localizes execution states and elapsed runtime", () => {
    expect(runningMessage(AgentExecutionStatus.QUEUED, null, chinese)).toBe(
      "排队等待执行",
    );
    expect(runningMessage(AgentExecutionStatus.REVIEW, null, chinese)).toBe(
      "等待审核",
    );
    expect(
      runningMessage(
        AgentExecutionStatus.RUNNING,
        "2026-11-18T11:55:00Z",
        chinese,
      ),
    ).toBe("已运行 5 分钟");
  });

  it("localizes schedule countdowns, categories, and empty states", () => {
    const agent = {
      next_scheduled_run: "2026-11-18T12:20:00Z",
    } as LibraryAgent;
    expect(getAgentStatusLabel("scheduled", agent, chinese)).toBe(
      "计划在 20 分钟后运行",
    );
    expect(getAgentStatusLabel("listening", agent, chinese)).toBe(
      "等待触发事件",
    );
    expect(getEmptyMessage("running", chinese)).toBe(
      "当前没有正在运行的工作流",
    );
    expect(getEmptyMessage("healthy", chinese)).toBe("此分类下没有工作流");
    expect(getAgentStatusLabel("scheduled", agent)).toBe(
      "Scheduled to run in 20m",
    );
  });

  it("formats relative dates with the selected language", () => {
    expect(formatRelativeDate("2026-11-18T11:55:00Z", "zh-CN")).toBe(
      "5 分钟前",
    );
    expect(formatRelativeDate("2026-11-18T11:55:00Z")).toBe("5m ago");
  });

  it("localizes validation without translating field keys or titles", () => {
    expect(
      validateInputs(
        {
          properties: {
            api_field: { title: "English Title" },
            hidden_field: { hidden: true },
          },
          required: ["api_field", "hidden_field"],
        },
        {},
        chinese,
      ),
    ).toEqual({ api_field: "English Title 为必填项" });
    expect(
      validateCredentials({ properties: { service_key: {} } }, {}, chinese),
    ).toEqual({ service_key: "需要提供 service_key 的凭据" });
    expect(
      validateInputs(
        { properties: { count: {} }, required: ["count"] },
        { count: 0 },
        chinese,
      ),
    ).toEqual({});
    expect(parseCronDescription("0 9 * * 1", chinese)).toBe("每周一上午 9:00");
    expect(parseCronDescription("7 13 2 * *", chinese)).toBe("7 13 2 * *");
  });

  it("localizes generated prompts without changing names, errors, tool names, or IDs", () => {
    const item = {
      priority: "error",
      agentID: "exact-English-ID",
      agentName: "English Workflow",
      message: "ECONNREFUSED",
    } as SitrepItemData;
    const prompt = buildAutoPilotPrompt(item, chinese);
    expect(prompt).toContain("请检查日志");
    expect(prompt).toContain("English Workflow");
    expect(prompt).toContain("ECONNREFUSED");
    expect(prompt).toContain("find_library_agent");
    expect(prompt).toContain("agent_id exact-English-ID");
    expect(buildAutoPilotPrompt(item)).toContain(
      "What happened with English Workflow?",
    );
  });
});
