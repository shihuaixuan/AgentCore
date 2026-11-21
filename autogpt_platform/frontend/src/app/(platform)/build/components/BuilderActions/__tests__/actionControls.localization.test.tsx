import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { BlockUIType } from "../../types";
import { useGraphStore } from "../../../stores/graphStore";
import { useNodeStore } from "../../../stores/nodeStore";
import { ScheduleGraph } from "../components/ScheduleGraph/ScheduleGraph";
import { AgentOutputs } from "../components/AgentOutputs/AgentOutputs";
import { UndoRedoButtons } from "../../NewControlPanel/UndoRedoButtons";
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";

const { schedule, outputActions } = vi.hoisted(() => ({
  schedule: vi.fn(),
  outputActions: vi.fn(),
}));
vi.mock("../components/ScheduleGraph/useScheduleGraph", () => ({
  useScheduleGraph: () => ({ handleScheduleGraph: schedule }),
}));
vi.mock("../components/RunInputDialog/RunInputDialog", () => ({
  RunInputDialog: () => null,
}));
vi.mock("../components/CronSchedulerDialog/CronSchedulerDialog", () => ({
  CronSchedulerDialog: () => null,
}));
vi.mock("@/components/contextual/OutputRenderers", () => ({
  globalRegistry: { getRenderer: () => ({}) },
  OutputActions: outputActions,
  OutputItem: () => null,
}));

afterEach(() => {
  useGraphStore.setState({ outputSchema: null });
  useNodeStore.setState({ nodes: [] });
  vi.clearAllMocks();
});

it("schedules from a named button, including an English name without a provider", () => {
  const { rerender } = render(<ScheduleGraph flowID="graph-ID" />);
  expect(
    screen.getByRole("button", { name: "Schedule Workflow" }),
  ).toBeDefined();
  rerender(
    <LanguageProvider initialLocale="zh-CN">
      <ScheduleGraph flowID="graph-ID" />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "定时运行工作流" }));
  expect(schedule).toHaveBeenCalledOnce();
});

function showOutputs(hasResult: boolean) {
  useGraphStore.setState({ outputSchema: { properties: { output: {} } } });
  useNodeStore.setState({
    nodes: [
      {
        id: "node-ID",
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          uiType: BlockUIType.OUTPUT,
          title: "Output block",
          block_id: "block-ID",
          description: "",
          inputSchema: {},
          outputSchema: {},
          costs: [],
          categories: [],
          hardcodedValues: { description: "User description" },
          nodeExecutionResults: hasResult
            ? [
                {
                  node_exec_id: "exec-ID",
                  output_data: { output: ["Original value"] },
                  status: "COMPLETED",
                  graph_id: "graph-ID",
                  node_id: "node-ID",
                  block_id: "block-ID",
                  graph_exec_id: "run-ID",
                  user_id: "user-ID",
                  graph_version: 1,
                  input_data: {},
                  add_time: new Date(0),
                  queue_time: null,
                  start_time: null,
                  end_time: null,
                },
              ]
            : [],
        },
      },
    ],
  });
  render(
    <LanguageProvider initialLocale="zh-CN">
      <AgentOutputs flowID="graph-ID" />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "工作流输出" }));
}

it("distinguishes an output block with no run results from a missing block", async () => {
  showOutputs(false);
  expect(await screen.findByText("暂无可显示的运行输出。")).toBeDefined();
});

it("keeps localized fallback labels out of output actions", async () => {
  showOutputs(true);
  expect(await screen.findByText("输出")).toBeDefined();
  expect(screen.getByText("User description")).toBeDefined();
  expect(outputActions.mock.lastCall?.[0].items).toEqual([
    expect.objectContaining({
      value: ["Original value"],
      metadata: { name: "Output", description: "User description" },
    }),
  ]);
});

it("names the history actions and exposes their existing shortcuts", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <TooltipProvider>
        <UndoRedoButtons />
      </TooltipProvider>
    </LanguageProvider>,
  );
  expect(
    screen
      .getByRole("button", { name: "撤销" })
      .getAttribute("aria-keyshortcuts"),
  ).toContain("+Z");
  expect(
    screen
      .getByRole("button", { name: "重做" })
      .getAttribute("aria-keyshortcuts"),
  ).toContain("+Y");
});
