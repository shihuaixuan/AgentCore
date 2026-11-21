import type { RJSFSchema } from "@rjsf/utils";
import { ReactFlowProvider } from "@xyflow/react";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render } from "@/tests/integrations/test-utils";
import { useEdgeStore } from "../../../../stores/edgeStore";
import { BlockUIType } from "../../../types";
import { OutputHandler } from "../OutputHandler";

const schema: RJSFSchema = {
  properties: {
    result: {
      title: "Result",
      type: "object",
      properties: { nested_key: { title: "Prompt", type: "string" } },
      additionalProperties: { title: "Prompt", type: "string" },
    },
    unknown: { title: "Custom result", type: "string" },
  },
};
const words = new Map([
  ["Result", "结果"],
  ["Prompt", "提示词"],
]);

afterEach(() => useEdgeStore.setState({ edges: [] }));

it("localizes declared outputs before adding user-named connection handles", () => {
  useEdgeStore.getState().addEdge({
    source: "source",
    sourceHandle: "result_#_Result",
    target: "sink",
    targetHandle: "input",
  });
  const edges = useEdgeStore.getState().edges;
  const original = structuredClone(schema);
  const { container } = render(
    <LanguageProvider>
      <ReactFlowProvider>
        <OutputHandler
          outputSchema={schema}
          nodeId="source"
          uiType={BlockUIType.STANDARD}
          schemaText={(text) => words.get(text) ?? text}
        />
      </ReactFlowProvider>
    </LanguageProvider>,
  );
  expect(screen.getByText("结果")).toBeDefined();
  expect(screen.getByText("Result")).toBeDefined();
  expect(screen.getByText("Custom result")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "展开" }));
  expect(screen.getByText("提示词")).toBeDefined();
  for (const key of ["result", "result_#_Result", "result_#_nested_key"]) {
    expect(container.querySelector(`[data-handleid="${key}"]`)).not.toBeNull();
  }
  expect(schema).toEqual(original);
  expect(useEdgeStore.getState().edges).toBe(edges);
});
