import {
  getGetV2GetBuilderBlockCategoriesMockHandler,
  getGetV2GetBuilderIntegrationProvidersMockHandler,
} from "@/app/api/__generated__/endpoints/default/default.msw";
import type { BlockInfo } from "@/app/api/__generated__/models/blockInfo";
import { useBlockMenuStore } from "@/app/(platform)/build/stores/blockMenuStore";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { SpecialBlockID } from "@/lib/autogpt-server-api";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { AllBlocksContent } from "../AllBlocksContent/AllBlocksContent";
import { Block } from "../Block";
import { IntegrationBlock } from "../IntergrationBlock";
import { PaginatedIntegrationList } from "../PaginatedIntegrationList/PaginatedIntegrationList";

const { addBlockWithPlacement } = vi.hoisted(() => ({
  addBlockWithPlacement: vi.fn(),
}));
vi.mock("../hooks/useAddBlockToBuilder", () => ({
  useAddBlockToBuilder: () => ({ addBlockWithPlacement }),
}));

const calculator: BlockInfo = {
  id: "b1ab9b19-67a6-406d-abf5-2dba76d00c79",
  name: "CalculatorBlock",
  description: "Performs a mathematical operation on two numbers.",
  inputSchema: { properties: { operation: {}, a: {}, b: {} } },
  outputSchema: { properties: { result: {} } },
  categories: [{ category: "LOGIC" }],
  costs: [],
  contributors: [],
  staticOutput: false,
  uiType: "Standard",
};

test.each([Block, IntegrationBlock])(
  "uses the same localized name on the card and drag image, but adds and drags the raw block",
  (Card) => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Card blockData={calculator} />
      </LanguageProvider>,
    );
    const card = screen.getByRole("button");
    const title = screen.getByText(/计算器/).textContent;
    expect(card.textContent).not.toContain(calculator.description);
    expect(card.textContent?.slice(title!.length)).toMatch(/\p{Script=Han}/u);
    fireEvent.click(card);
    expect(addBlockWithPlacement.mock.lastCall?.[0]).toBe(calculator);
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn() };
    fireEvent.dragStart(card, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/reactflow",
      JSON.stringify(calculator),
    );
    expect(dataTransfer.setDragImage.mock.lastCall?.[0].textContent).toBe(
      title,
    );
  },
);

test("localizes the category but preserves an unknown block's actual description", async () => {
  const block = {
    ...calculator,
    id: "custom-id",
    name: "AcmeFrobBlock",
    description: "Passes through the original Acme value.",
  };
  server.use(
    getGetV2GetBuilderBlockCategoriesMockHandler([
      { name: "logic", total_blocks: 1, blocks: [block] },
    ]),
  );
  render(
    <LanguageProvider initialLocale="zh-CN">
      <AllBlocksContent />
    </LanguageProvider>,
  );
  expect(await screen.findByText("逻辑")).toBeDefined();
  expect(screen.getByText("Acme Frob")).toBeDefined();
  expect(screen.getByText(block.description)).toBeDefined();
});

test.each(["AgentExecutorBlock", "my_MixedCase工作流"])(
  "does not persist the generic executor class as a manual rename: %s",
  (name) => {
    const block = {
      ...calculator,
      id: SpecialBlockID.AGENT,
      name,
      uiType: "Agent",
    };
    const update = vi
      .spyOn(useNodeStore.getState(), "updateNodeData")
      .mockImplementation(() => {});
    try {
      addBlockWithPlacement.mockReturnValueOnce({
        id: "new-node",
        data: { metadata: {} },
      });
      render(
        <LanguageProvider initialLocale="zh-CN">
          <Block blockData={block} />
        </LanguageProvider>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(addBlockWithPlacement.mock.lastCall?.[0]).toBe(block);
      if (name === "AgentExecutorBlock") {
        expect(update).not.toHaveBeenCalled();
      } else {
        expect(update).toHaveBeenCalledWith("new-node", {
          metadata: { customized_name: name },
        });
      }
    } finally {
      update.mockRestore();
    }
  },
);

test("uses the brand and a localized count for an integration, not its display label as the provider key", async () => {
  server.use(
    getGetV2GetBuilderIntegrationProvidersMockHandler({
      providers: [
        { name: "google_maps", description: "", integration_count: 2 },
      ],
      pagination: {
        current_page: 1,
        total_items: 1,
        total_pages: 1,
        page_size: 10,
      },
    }),
  );
  render(
    <LanguageProvider initialLocale="zh-CN">
      <PaginatedIntegrationList />
    </LanguageProvider>,
  );
  expect(await screen.findByText("Google 地图")).toBeDefined();
  fireEvent.click(screen.getByText("2 个可用模块"));
  expect(useBlockMenuStore.getState().integration).toBe("google_maps");
});
