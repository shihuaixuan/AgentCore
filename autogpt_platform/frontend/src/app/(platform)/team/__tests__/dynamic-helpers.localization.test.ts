import type { ExpertSetupItem } from "@/app/api/__generated__/models/expertSetupItem";
import { expect, test } from "vitest";
import { getSetupRowCopy } from "../components/SetupNeeded/helpers";
import {
  formatDelta,
  getChartDays,
} from "../[expertId]/components/ExpertOverview/helpers";

test("localizes setup instructions while preserving the profession, workflow and input names", () => {
  const item: ExpertSetupItem = {
    expert_id: "original-expert",
    expert_name: "Original Nova",
    expert_avatar_url: null,
    workflow_id: "original-workflow",
    workflow_name: "Original Workflow",
    library_agent_id: "original-library",
    providers: [],
    resolution: "inputs",
    missing_inputs: ["Email Address", "Original Topic"],
  };
  expect(getSetupRowCopy(item, "QA Engineer", "zh-CN")).toEqual({
    title: "为 QA Engineer 设置 Original Workflow 的计划",
    detail: "需要填写 Email Address、Original Topic 才能按计划运行。",
  });
  expect(getSetupRowCopy(item, "QA Engineer").detail).toBe(
    "Needs Email Address and Original Topic before it can run on schedule.",
  );
});

test("localizes activity comparison and chart dates without changing counts", () => {
  expect(formatDelta(0, "zh-CN")).toBe("与此前 30 天相同");
  expect(formatDelta(-2, "zh-CN")).toBe("比此前 30 天 −2");
  expect(formatDelta(2)).toBe("+2 vs the 30 days before");
  expect(
    getChartDays(
      [{ day: "2026-11-16" as unknown as Date, sessions: 2, runs: 3 }],
      "zh-CN",
    ),
  ).toEqual([{ key: "2026-11-16", label: "11月16日", sessions: 2, runs: 3 }]);
});
