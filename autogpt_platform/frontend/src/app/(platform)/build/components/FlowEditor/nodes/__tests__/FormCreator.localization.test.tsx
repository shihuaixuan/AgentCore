import type { RJSFSchema } from "@rjsf/utils";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/tests/integrations/test-utils";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { useNodeStore } from "../../../../stores/nodeStore";
import { useEdgeStore } from "../../../../stores/edgeStore";
import { useHistoryStore } from "../../../../stores/historyStore";
import { BlockUIType } from "../../../types";
import { FormCreator } from "../FormCreator";

const catalog = new Map([
  ["Prompt", "提示词"],
  ["Field help", "字段说明"],
  ["Options", "选项"],
]);
const translate = (text: string) => catalog.get(text) ?? text;
const schema = {
  type: "object",
  properties: {
    settings: {
      type: "object",
      title: "Options",
      properties: {
        raw_key: {
          type: "string",
          title: "Prompt",
          description: "Field help",
          placeholder: "{{ Prompt }}",
        },
      },
    },
    reasoning_effort: {
      type: "string",
      enum: ["low", "high", "Prompt"],
      title: "Mode",
    },
    choice: {
      title: "Choice",
      anyOf: [
        { type: "string", title: "Prompt" },
        { type: "integer" },
        { type: "null" },
      ],
    },
  },
} as RJSFSchema;
const initial = {
  settings: { raw_key: "Prompt" },
  reasoning_effort: "low",
  choice: "x",
};

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

function setup(trusted = true) {
  useNodeStore.setState({
    nodes: [
      {
        id: "a",
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          block_id: "fixture",
          uiType: BlockUIType.STANDARD,
          title: "Prompt",
          description: "Field help",
          costs: [],
          categories: [],
          inputSchema: schema,
          outputSchema: {},
          hardcodedValues: initial,
          errors: {
            reasoning_effort: "This field is required",
            choice: "This field is required: Prompt",
          },
        },
      },
    ],
  });
  return render(
    <LanguageProvider>
      <SwitchLanguage />
      <FormCreator
        jsonSchema={schema}
        nodeId="a"
        uiType={BlockUIType.STANDARD}
        schemaText={trusted ? translate : undefined}
        showHandles={false}
      />
    </LanguageProvider>,
  );
}

afterEach(() => {
  useNodeStore.setState({ nodes: [] });
  useEdgeStore.setState({ edges: [] });
  useHistoryStore.setState({ past: [], future: [] });
});

describe("node configuration display language", () => {
  it("keeps nested names, descriptions, exact validation and enum labels out of saved values", async () => {
    const user = userEvent.setup();
    const original = structuredClone(schema);
    setup();
    const input = screen.getByRole("textbox", { name: "提示词" });
    expect(input.getAttribute("placeholder")).toBe("{{ Prompt }}");
    expect(screen.getByDisplayValue("Prompt")).toBe(input);
    expect(screen.getByText("字段说明")).toBeDefined();
    expect(screen.getByText("此字段为必填项")).toBeDefined();
    expect(screen.getByText("This field is required: Prompt")).toBeDefined();
    const mode = screen.getByRole("combobox", { name: "Mode" });
    expect(mode.textContent).toContain("低");
    await user.click(mode);
    expect(await screen.findByRole("option", { name: "Prompt" })).toBeDefined();
    await user.click(screen.getByRole("option", { name: "高" }));
    fireEvent.change(input, { target: { value: "Field help" } });
    const values = {
      ...initial,
      reasoning_effort: "high",
      settings: { raw_key: "Field help" },
    };
    await waitFor(() =>
      expect(useNodeStore.getState().getHardCodedValues("a")).toEqual(values),
    );
    const graph = useNodeStore.getState().nodes;
    const history = useHistoryStore.getState().past;
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(
      await screen.findByRole("textbox", { name: "Prompt" }),
    ).toBeDefined();
    expect(mode.textContent).toContain("high");
    expect(screen.getByText("This field is required")).toBeDefined();
    expect(useNodeStore.getState().nodes).toBe(graph);
    expect(useHistoryStore.getState().past).toBe(history);
    expect(graph[0].data.inputSchema).toBe(schema);
    expect(schema).toEqual(original);
  });

  it("prefers an authored union option title to its type and localizes only the type fallback", async () => {
    const user = userEvent.setup();
    setup();
    const choice = screen.getByRole("combobox", { name: "Choice — 类型选项" });
    expect(choice.textContent).toContain("提示词");
    await user.click(choice);
    expect(await screen.findByRole("option", { name: "整数" })).toBeDefined();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(choice.textContent).toContain("Prompt");
    expect(useNodeStore.getState().getHardCodedValues("a")).toEqual(initial);
  });

  it("preserves authored titles, descriptions and enum labels when the schema is external", () => {
    setup(false);
    expect(screen.getByRole("textbox", { name: "Prompt" })).toBeDefined();
    expect(screen.getByText("Field help")).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: "Mode" }).textContent,
    ).toContain("low");
    expect(screen.queryByText("提示词")).toBeNull();
  });
});
