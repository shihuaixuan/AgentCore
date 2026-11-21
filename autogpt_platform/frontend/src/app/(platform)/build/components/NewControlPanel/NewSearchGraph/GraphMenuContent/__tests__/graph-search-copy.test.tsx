import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { BlockUIType } from "../../../../types";
import {
  type SearchableNode,
  useGraphSearch,
} from "../../GraphMenuSearchBar/useGraphMenuSearchBar";
import { GraphSearchContent } from "../GraphContent";

const calculator: SearchableNode = {
  id: "node-321",
  type: "custom",
  position: { x: 0, y: 0 },
  data: {
    block_id: "b1ab9b19-67a6-406d-abf5-2dba76d00c79",
    title: "CalculatorBlock",
    description: "Performs a mathematical operation on two numbers.",
    inputSchema: { properties: { round_result: {} } },
    outputSchema: { properties: { result: {} } },
    uiType: BlockUIType.STANDARD,
    categories: [],
    costs: [],
    hardcodedValues: {},
    metadata: { customized_name: "My_exactName" },
  },
};

function GraphSearch({ nodes }: { nodes: SearchableNode[] }) {
  const { searchQuery, setSearchQuery, filteredNodes } = useGraphSearch(nodes);
  return (
    <GraphSearchContent
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filteredNodes={filteredNodes}
      onNodeSelect={vi.fn()}
    />
  );
}

test("matches both block languages, raw field names, node IDs and manual names", async () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <GraphSearch nodes={[calculator]} />
    </LanguageProvider>,
  );
  const search = screen.getByRole("textbox");
  for (const value of [
    "计算器",
    "CalculatorBlock",
    "mathematical",
    "round_result",
    "node-321",
    "My_exactName",
  ]) {
    fireEvent.change(search, { target: { value: "~~~~!!!!" } });
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
    fireEvent.change(search, { target: { value } });
    const row = await screen.findByRole("option", { name: /My_exactName/ });
    expect(within(row).getByText("My_exactName")).toBeDefined();
    expect(within(row).getByText("计算器")).toBeDefined();
    expect(row.textContent).toContain("round_result");
  }
});

test("uses the localized canvas title and description when a node has no interface summary", async () => {
  const node = {
    ...calculator,
    data: {
      ...calculator.data,
      inputSchema: {},
      outputSchema: {},
      metadata: {},
    },
  };
  render(
    <LanguageProvider initialLocale="zh-CN">
      <GraphSearch nodes={[node]} />
    </LanguageProvider>,
  );
  const row = screen.getByRole("option");
  expect(within(row).getByText("计算器")).toBeDefined();
  const description = row.textContent?.replace("计算器", "") ?? "";
  expect(description).toMatch(/\p{Script=Han}/u);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "~~~~!!!!" },
  });
  await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: description },
  });
  expect(await screen.findByText("找到 1 个节点")).toBeDefined();
});
