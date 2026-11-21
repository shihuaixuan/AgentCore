import { getGetV1ListAvailableBlocksMockHandler } from "@/app/api/__generated__/endpoints/blocks/blocks.msw";
import { getGetV2BuilderSearchMockHandler } from "@/app/api/__generated__/endpoints/store/store.msw";
import type { BlockInfo } from "@/app/api/__generated__/models/blockInfo";
import type { SearchResponse } from "@/app/api/__generated__/models/searchResponse";
import type { StoreAgent } from "@/app/api/__generated__/models/storeAgent";
import { useBlockMenuStore } from "@/app/(platform)/build/stores/blockMenuStore";
import { SpecialBlockID } from "@/lib/autogpt-server-api";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { beforeEach, expect, test, vi } from "vitest";
import { BlockMenuSearch } from "../BlockMenuSearch/BlockMenuSearch";

vi.mock("../hooks/useAddBlockToBuilder", () => ({
  useAddBlockToBuilder: () => ({ addBlockWithPlacement: vi.fn() }),
}));

const calculator: BlockInfo = {
  id: "b1ab9b19-67a6-406d-abf5-2dba76d00c79",
  name: "CalculatorBlock",
  description: "Performs a mathematical operation on two numbers.",
  categories: [{ category: "LOGIC" }],
  contributors: [],
  costs: [],
  inputSchema: { properties: { round_result: {} } },
  outputSchema: { properties: { result: {} } },
  staticOutput: false,
  uiType: "Standard",
};
const integration = {
  ...calculator,
  id: "external-integration",
  name: "AcmeLogicBlock",
  inputSchema: { properties: { token: { credentials_provider: ["github"] } } },
};
const extension = {
  ...calculator,
  id: "custom-logic",
  name: "BranchByScoreBlock",
  description: "Routes by score.",
};
const workflow: StoreAgent = {
  agent_name: "小组周报_MyWorkflow",
  creator: "OwnerName",
  slug: "weekly",
  agent_image: "",
  creator_avatar: "",
  description: "",
  sub_heading: "",
  runs: 2,
  rating: 1,
  agent_graph_id: "custom-graph",
};
const noCounts = {
  blocks: 0,
  integrations: 0,
  my_agents: 0,
  marketplace_agents: 0,
};

function response(
  items: SearchResponse["items"],
  total_items = noCounts,
  page = 1,
): SearchResponse {
  const total = Object.values(total_items).reduce(
    (sum, count) => sum + count,
    0,
  );
  return {
    items,
    total_items,
    search_id: "session-1",
    pagination: {
      current_page: page,
      page_size: 8,
      total_items: total,
      total_pages: Math.ceil(total / 8),
    },
  };
}

function renderSearch() {
  return render(
    <LanguageProvider initialLocale="zh-CN">
      <BlockMenuSearch />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  useBlockMenuStore.setState({
    searchQuery: "逻辑",
    searchId: "session-1",
    filters: [],
    creators: [],
    creators_list: [],
    categoryCounts: noCounts,
  });
});

test("keeps the raw query, workflows, counts and filters alongside extra Chinese category matches", async () => {
  const fetchCatalog = vi.fn(() => [
    extension,
    integration,
    { ...calculator, id: SpecialBlockID.AGENT, name: "AgentExecutorBlock" },
  ]);
  const requests: URLSearchParams[] = [];
  server.use(
    getGetV1ListAvailableBlocksMockHandler(fetchCatalog),
    getGetV2BuilderSearchMockHandler(({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      if (params.get("search_query") !== "逻辑" || params.has("filter"))
        return response([]);
      return response([workflow], { ...noCounts, marketplace_agents: 1 });
    }),
  );
  renderSearch();
  expect(await screen.findByText("中文模块匹配（2）")).toBeDefined();
  expect(screen.getByText(workflow.agent_name)).toBeDefined();
  expect(screen.getByText("Branch By Score")).toBeDefined();
  expect(screen.getByText("Acme Logic")).toBeDefined();
  await waitFor(() =>
    expect(useBlockMenuStore.getState().categoryCounts).toEqual({
      ...noCounts,
      marketplace_agents: 1,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "集成" }));
  expect(await screen.findByText("中文模块匹配（1）")).toBeDefined();
  expect(screen.queryByText("Branch By Score")).toBeNull();
  expect(screen.getByText("Acme Logic")).toBeDefined();
  act(() => {
    useBlockMenuStore.getState().setFilters(["my_agents"]);
  });
  expect(await screen.findByText("未找到匹配结果")).toBeDefined();
  expect(screen.queryByText("Acme Logic")).toBeNull();
  act(() => {
    useBlockMenuStore.getState().setFilters([]);
    useBlockMenuStore.getState().setCreators(["OwnerName"]);
  });
  expect(await screen.findByText(workflow.agent_name)).toBeDefined();
  expect(screen.queryByText("Branch By Score")).toBeNull();
  expect(
    requests.some((params) => params.get("filter") === "integrations"),
  ).toBe(true);
  expect(requests.at(-1)?.get("by_creator")).toBe("OwnerName");
  expect(
    requests.every(
      (params) =>
        params.get("search_query") === "逻辑" &&
        params.get("search_id") === "session-1",
    ),
  ).toBe(true);
  expect(fetchCatalog).toHaveBeenCalledTimes(1);
});

test("a later backend page takes ownership of an already shown local match without double-counting", async () => {
  const releaseNextPage = Promise.withResolvers<void>();
  const pages: string[] = [];
  const totals = { ...noCounts, blocks: 1, marketplace_agents: 8 };
  server.use(
    getGetV1ListAvailableBlocksMockHandler([extension]),
    getGetV2BuilderSearchMockHandler(async ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (params.get("search_query") !== "逻辑") return response([]);
      const page = params.get("page")!;
      pages.push(page);
      if (page === "2") {
        await releaseNextPage.promise;
        return response(
          [{ ...extension, description: "Server version" }],
          totals,
          2,
        );
      }
      return response(
        Array.from({ length: 8 }, (_, index) => ({
          ...workflow,
          slug: `weekly-${index}`,
        })),
        totals,
      );
    }),
  );
  renderSearch();
  try {
    expect(await screen.findByText("中文模块匹配（1）")).toBeDefined();
    expect(screen.getAllByText("Branch By Score")).toHaveLength(1);
    await waitFor(() => expect(pages).toContain("2"));
  } finally {
    releaseNextPage.resolve();
  }
  await waitFor(() =>
    expect(screen.queryByText("中文模块匹配（1）")).toBeNull(),
  );
  expect(await screen.findByText("Server version")).toBeDefined();
  expect(screen.getAllByText("Branch By Score")).toHaveLength(1);
  expect(useBlockMenuStore.getState().categoryCounts).toEqual(totals);
});

test("an English author query still goes only to backend search", async () => {
  const fetchCatalog = vi.fn(() => [{ ...calculator }]);
  useBlockMenuStore.setState({ searchQuery: "OwnerName" });
  server.use(
    getGetV1ListAvailableBlocksMockHandler(fetchCatalog),
    getGetV2BuilderSearchMockHandler(({ request }) =>
      new URL(request.url).searchParams.get("search_query") === "OwnerName"
        ? response([workflow], { ...noCounts, marketplace_agents: 1 })
        : response([]),
    ),
  );
  renderSearch();
  expect(await screen.findByText(workflow.agent_name)).toBeDefined();
  expect(fetchCatalog).not.toHaveBeenCalled();
});

test("expanding a local page does not advance server pagination", async () => {
  const search = vi.fn(({ request }: { request: Request }) =>
    new URL(request.url).searchParams.get("search_query") === "逻辑"
      ? response([])
      : response([workflow]),
  );
  server.use(
    getGetV2BuilderSearchMockHandler(search),
    getGetV1ListAvailableBlocksMockHandler(
      Array.from({ length: 9 }, (_, index) => ({
        ...extension,
        id: `extension-${index}`,
        name: `Extension ${index} Block`,
      })),
    ),
  );
  renderSearch();
  expect(await screen.findByText("中文模块匹配（9）")).toBeDefined();
  expect(screen.queryByText("Extension 8")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "显示更多匹配模块" }));
  expect(await screen.findByText("Extension 8")).toBeDefined();
  expect(search).toHaveBeenCalledTimes(1);
});

test.each(["计算器", "数学运算 round_result"])(
  "finds a localized title or description with an English pin: %s",
  async (query) => {
    useBlockMenuStore.setState({ searchQuery: query });
    server.use(
      getGetV1ListAvailableBlocksMockHandler([{ ...calculator }]),
      getGetV2BuilderSearchMockHandler(({ request }) =>
        new URL(request.url).searchParams.get("search_query") === query
          ? response([])
          : response([workflow]),
      ),
    );
    renderSearch();
    expect(await screen.findByRole("button", { name: /计算器/ })).toBeDefined();
    expect(screen.getByText("中文模块匹配（1）")).toBeDefined();
  },
);
