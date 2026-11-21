import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@/tests/integrations/test-utils";
import React from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useGraphStore } from "../stores/graphStore";

vi.mock(
  "@/app/(platform)/build/components/BuilderActions/components/RunGraph/useRunGraph",
  () => ({
    useRunGraph: vi.fn(),
  }),
);

vi.mock(
  "@/app/(platform)/build/components/BuilderActions/components/RunInputDialog/RunInputDialog",
  () => ({
    RunInputDialog: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="run-input-dialog">Dialog</div> : null,
  }),
);

// Must import after mocks
import { useRunGraph } from "../components/BuilderActions/components/RunGraph/useRunGraph";
import { RunGraph } from "../components/BuilderActions/components/RunGraph/RunGraph";

const mockUseRunGraph = vi.mocked(useRunGraph);

function createMockReturnValue(
  overrides: Partial<ReturnType<typeof useRunGraph>> = {},
) {
  return {
    handleRunGraph: vi.fn(),
    handleStopGraph: vi.fn(),
    openRunInputDialog: false,
    setOpenRunInputDialog: vi.fn(),
    isExecutingGraph: false,
    isTerminatingGraph: false,
    isSaving: false,
    runTarget: null,
    ...overrides,
  };
}

// RunGraph uses Tooltip which requires TooltipProvider
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";

function renderRunGraph(flowID: string | null = "test-flow-id") {
  return render(
    <TooltipProvider>
      <RunGraph flowID={flowID} />
    </TooltipProvider>,
  );
}

/** Get the primary Run/Stop button by its data-id attribute. */
function getButtonByDataId(dataId: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`[data-id="${dataId}"]`);
  if (!el) throw new Error(`Button with data-id="${dataId}" not found`);
  return el;
}

describe("RunGraph", () => {
  it("names the run, simulation, stop and busy controls in Chinese before opening a tooltip", () => {
    const run = vi.fn();
    const stop = vi.fn();
    mockUseRunGraph.mockReturnValue(
      createMockReturnValue({ handleRunGraph: run, handleStopGraph: stop }),
    );
    function controls() {
      return (
        <LanguageProvider initialLocale="zh-CN">
          <RunGraph flowID="graph-ID" />
        </LanguageProvider>
      );
    }
    const { rerender } = render(controls());
    fireEvent.click(screen.getByRole("button", { name: "模拟工作流" }));
    expect(run).toHaveBeenCalledWith({ dryRun: true });
    fireEvent.click(screen.getByRole("button", { name: "运行工作流" }));
    expect(run).toHaveBeenLastCalledWith();
    useGraphStore.getState().setIsGraphRunning(true);
    rerender(controls());
    fireEvent.click(screen.getByRole("button", { name: "停止工作流" }));
    expect(stop).toHaveBeenCalledOnce();
    mockUseRunGraph.mockReturnValue(
      createMockReturnValue({ isTerminatingGraph: true }),
    );
    rerender(controls());
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "处理中…" })
        .disabled,
    ).toBe(true);
  });

  beforeEach(() => {
    cleanup();
    mockUseRunGraph.mockReturnValue(createMockReturnValue());
    useGraphStore.setState({ isGraphRunning: false });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an enabled button when flowID is provided", () => {
    renderRunGraph("test-flow-id");
    expect(getButtonByDataId("run-graph-button").disabled).toBe(false);
  });

  it("renders a disabled button when flowID is null", () => {
    renderRunGraph(null);
    expect(getButtonByDataId("run-graph-button").disabled).toBe(true);
  });

  it("disables the button when isExecutingGraph is true", () => {
    mockUseRunGraph.mockReturnValue(
      createMockReturnValue({ isExecutingGraph: true }),
    );
    renderRunGraph();
    expect(getButtonByDataId("run-graph-button").disabled).toBe(true);
  });

  it("disables the button when isTerminatingGraph is true", () => {
    mockUseRunGraph.mockReturnValue(
      createMockReturnValue({ isTerminatingGraph: true }),
    );
    renderRunGraph();
    expect(getButtonByDataId("run-graph-button").disabled).toBe(true);
  });

  it("disables the button when isSaving is true", () => {
    mockUseRunGraph.mockReturnValue(createMockReturnValue({ isSaving: true }));
    renderRunGraph();
    expect(getButtonByDataId("run-graph-button").disabled).toBe(true);
  });

  it("uses data-id run-graph-button when not running", () => {
    renderRunGraph();
    expect(getButtonByDataId("run-graph-button")).toBeDefined();
  });

  it("uses data-id stop-graph-button when running", () => {
    useGraphStore.setState({ isGraphRunning: true });
    renderRunGraph();
    expect(getButtonByDataId("stop-graph-button")).toBeDefined();
  });

  it("calls handleRunGraph when clicked and graph is not running", () => {
    const handleRunGraph = vi.fn();
    mockUseRunGraph.mockReturnValue(createMockReturnValue({ handleRunGraph }));
    renderRunGraph();
    fireEvent.click(getButtonByDataId("run-graph-button"));
    expect(handleRunGraph).toHaveBeenCalledOnce();
  });

  it("calls handleStopGraph when clicked and graph is running", () => {
    const handleStopGraph = vi.fn();
    mockUseRunGraph.mockReturnValue(createMockReturnValue({ handleStopGraph }));
    useGraphStore.setState({ isGraphRunning: true });
    renderRunGraph();
    fireEvent.click(getButtonByDataId("stop-graph-button"));
    expect(handleStopGraph).toHaveBeenCalledOnce();
  });

  it("renders RunInputDialog hidden by default", () => {
    renderRunGraph();
    expect(screen.queryByTestId("run-input-dialog")).toBeNull();
  });

  it("renders RunInputDialog when openRunInputDialog is true", () => {
    mockUseRunGraph.mockReturnValue(
      createMockReturnValue({ openRunInputDialog: true }),
    );
    renderRunGraph();
    expect(screen.getByTestId("run-input-dialog")).toBeDefined();
  });

  it("renders the simulate button when graph is not running", () => {
    renderRunGraph("test-flow-id");
    expect(
      document.querySelector('[data-id="simulate-graph-button"]'),
    ).not.toBeNull();
  });

  it("hides the simulate button when graph is running", () => {
    useGraphStore.setState({ isGraphRunning: true });
    renderRunGraph();
    expect(
      document.querySelector('[data-id="simulate-graph-button"]'),
    ).toBeNull();
  });
});
