import type { RJSFSchema } from "@rjsf/utils";
import { ReactFlow } from "@xyflow/react";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { afterEach, expect, it, vi } from "vitest";
import { BlockUIType } from "../../../types";
import { useNodeStore } from "../../../../stores/nodeStore";
import { CustomNode } from "../CustomNode/CustomNode";

const resultSchema = vi.fn<(schema?: RJSFSchema) => void>();
vi.mock("../CustomNode/components/NodeOutput/NodeOutput", () => ({
  NodeDataRenderer: ({
    builtInOutputSchema,
  }: {
    builtInOutputSchema?: RJSFSchema;
  }) => {
    resultSchema(builtInOutputSchema);
    return null;
  },
}));
vi.mock("../CustomNode/components/NodeHeader", () => ({
  NodeHeader: () => null,
}));
vi.mock(
  "../CustomNode/components/SubAgentUpdate/SubAgentUpdateFeature",
  () => ({ SubAgentUpdateFeature: () => null }),
);

const calculatorID = "b1ab9b19-67a6-406d-abf5-2dba76d00c79";
const input: RJSFSchema = {
  type: "object",
  properties: {
    operation: { type: "string", title: "Operation", enum: ["Add", "Divide"] },
    round_result: { type: "boolean", title: "Round Result" },
  },
};
const output: RJSFSchema = {
  properties: { result: { type: "number", title: "Result" } },
};
const values = { operation: "Add", round_result: false };
const nodeTypes = { custom: CustomNode };

afterEach(() => {
  resultSchema.mockClear();
  useNodeStore.setState({ nodes: [] });
});

it.each([
  [BlockUIType.STANDARD, calculatorID, true],
  [BlockUIType.STANDARD, "unknown-block", false],
  [BlockUIType.AGENT, calculatorID, false],
  [BlockUIType.MCP_TOOL, calculatorID, false],
] as const)(
  "uses the schema source rather than text similarity: %s %s",
  async (uiType, blockID, builtIn) => {
    const hardcodedValues =
      uiType === BlockUIType.AGENT
        ? { inputs: values, input_schema: input, output_schema: output }
        : uiType === BlockUIType.MCP_TOOL
          ? { tool_arguments: values, tool_input_schema: input }
          : values;
    const node: CustomNode = {
      id: "a",
      type: "custom",
      position: { x: 0, y: 0 },
      width: 320,
      height: 240,
      data: {
        block_id: blockID,
        uiType,
        hardcodedValues,
        title: "Calculator",
        description: "",
        costs: [],
        categories: [],
        inputSchema: input,
        outputSchema: output,
      },
    };
    useNodeStore.setState({ nodes: [node] });
    render(
      <LanguageProvider>
        <ReactFlow nodes={[node]} nodeTypes={nodeTypes} />
      </LanguageProvider>,
    );
    const select = await screen.findByRole("combobox", {
      name: builtIn ? "运算" : "Operation",
    });
    expect(select.textContent).toBe(builtIn ? "加法" : "Add");
    expect(
      screen.getByText(builtIn ? "结果取整" : "Round Result"),
    ).toBeDefined();
    expect(screen.getByText(builtIn ? "结果" : "Result")).toBeDefined();
    expect(resultSchema.mock.lastCall?.[0]).toBe(builtIn ? output : undefined);
    expect(useNodeStore.getState().getHardCodedValues("a")).toEqual(
      hardcodedValues,
    );
  },
);
