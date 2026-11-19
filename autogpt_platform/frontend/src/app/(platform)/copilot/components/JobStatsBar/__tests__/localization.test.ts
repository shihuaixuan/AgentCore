import type { UIDataTypes, UIMessage, UITools } from "ai";
import { describe, expect, it } from "vitest";
import { formatElapsed } from "../formatElapsed";
import {
  getLiveTurnEndAnnouncement,
  getTurnEndLabel,
  type TurnOutcome,
} from "../helpers";
import { getWorkDoneCounters } from "../useWorkDoneCounters";

type Msg = UIMessage<unknown, UIDataTypes, UITools>;

function tools(names: string[], role: Msg["role"] = "assistant"): Msg {
  return {
    id: role,
    role,
    parts: names.map((name, index) => ({
      type: `tool-${name}`,
      toolCallId: `call-${index}`,
      state: "output-available",
      input: {},
      output: {},
    })) as Msg["parts"],
  };
}

describe("localized elapsed time", () => {
  it.each<[number, string, string]>([
    [0, "0秒", "0s"],
    [22, "22秒", "22s"],
    [60, "1分0秒", "1m 0s"],
    [134, "2分14秒", "2m 14s"],
  ])("formats %i seconds without changing the duration", (seconds, zh, en) => {
    expect(formatElapsed(seconds, "zh-CN")).toBe(zh);
    expect(formatElapsed(seconds, "en")).toBe(en);
    expect(formatElapsed(seconds)).toBe(en);
  });
});

describe("localized turn labels", () => {
  it.each<[TurnOutcome, number | null, string | null, string | null]>([
    ["done", 134, "已完成，用时 2分14秒", "Done in 2m 14s"],
    ["done", null, "已完成", "Done"],
    ["stopped", 22, "已停止，用时 22秒", "Stopped after 22s"],
    ["stopped", null, "已停止", "Stopped"],
    ["unsettled", 22, "思考用时 22秒", "Thought for 22s"],
    ["unsettled", null, null, null],
    ["settling", 22, "22秒", "22s"],
    ["settling", null, null, null],
  ])("localizes %s with %s seconds", (outcome, seconds, zh, en) => {
    expect(getTurnEndLabel(outcome, seconds, "zh-CN")).toBe(zh);
    expect(getTurnEndLabel(outcome, seconds, "en")).toBe(en);
    expect(getTurnEndLabel(outcome, seconds)).toBe(en);
  });

  it("localizes completed replies but keeps unfinished turns silent", () => {
    const completed = [tools(["run_block"])];
    expect(getLiveTurnEndAnnouncement(completed, "zh-CN")).toBe("回复已完成");
    expect(getLiveTurnEndAnnouncement(completed, "en")).toBe("Reply finished");
    expect(getLiveTurnEndAnnouncement(completed)).toBe("Reply finished");
    expect(getLiveTurnEndAnnouncement([], "zh-CN")).toBe("");
    expect(
      getLiveTurnEndAnnouncement([tools(["run_block"], "user")], "zh-CN"),
    ).toBe("");
  });
});

describe("localized work counters", () => {
  it.each([
    ["find_agent", "search", "次搜索", "searches"],
    ["find_library_agent", "search", "次搜索", "searches"],
    ["run_agent", "workflow run", "次工作流运行", "workflows run"],
    ["run_block", "action", "次操作", "actions"],
    ["run_capability", "action", "次操作", "actions"],
    [
      "create_agent",
      "workflow created",
      "个已创建的工作流",
      "workflows created",
    ],
    ["edit_agent", "workflow edited", "个已编辑的工作流", "workflows edited"],
    [
      "schedule_agent",
      "workflow scheduled",
      "个已安排的工作流",
      "workflows scheduled",
    ],
  ])(
    "localizes %s without changing its category or count",
    (tool, category, zh, en) => {
      const messages = [tools([tool, tool])];
      expect(getWorkDoneCounters(messages, "zh-CN").counters).toEqual([
        { label: zh, category, count: 2 },
      ]);
      expect(getWorkDoneCounters(messages, "en").counters).toEqual([
        { label: en, category, count: 2 },
      ]);
      expect(getWorkDoneCounters(messages).counters).toEqual([
        { label: en, category, count: 2 },
      ]);
    },
  );

  it("preserves aggregation, ordering, ignored tools and the three-counter limit", () => {
    const messages = [
      tools(["run_block"], "user"),
      tools([
        "run_agent",
        "run_block",
        "find_agent",
        "run_capability",
        "create_agent",
        "find_library_agent",
        "run_agent",
        "run_block",
        "unknown_tool",
      ]),
    ];
    expect(getWorkDoneCounters(messages, "zh-CN").counters).toEqual([
      { label: "次操作", category: "action", count: 3 },
      { label: "次工作流运行", category: "workflow run", count: 2 },
      { label: "次搜索", category: "search", count: 2 },
    ]);
    expect(
      getWorkDoneCounters([tools(["run_block"])], "zh-CN").counters,
    ).toEqual([{ label: "次操作", category: "action", count: 1 }]);
    expect(getWorkDoneCounters([tools(["run_block"])]).counters).toEqual([
      { label: "action", category: "action", count: 1 },
    ]);
  });
});
