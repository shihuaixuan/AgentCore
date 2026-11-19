import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Integration } from "../components/NewControlPanel/NewBlockMenu/Integration";
import { MarketplaceAgentBlock } from "../components/NewControlPanel/NewBlockMenu/MarketplaceAgentBlock";
import { UGCAgentBlock } from "../components/NewControlPanel/NewBlockMenu/UGCAgentBlock";
import { BlockMenuFilters } from "../components/NewControlPanel/NewBlockMenu/BlockMenuFilters/BlockMenuFilters";
import { useBlockMenuStore } from "../stores/blockMenuStore";
import { GraphSearchContent } from "../components/NewControlPanel/NewSearchGraph/GraphMenuContent/GraphContent";
import type { SearchableNode } from "../components/NewControlPanel/NewSearchGraph/GraphMenuSearchBar/useGraphMenuSearchBar";
import { getNodeInputOutputSummary } from "../components/NewControlPanel/NewSearchGraph/GraphMenuContent/helpers";

function chinese(_english: string, translation: string) {
  return translation;
}

beforeEach(() => {
  useBlockMenuStore.setState({ filters: [], creators: [], creators_list: [] });
});

describe("localized builder display surfaces", () => {
  it("localizes filter data while keeping API category keys", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <BlockMenuFilters />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "市场工作流" }));
    expect(useBlockMenuStore.getState().filters).toEqual([
      "marketplace_agents",
    ]);
    expect(screen.getByRole("button", { name: "模块" })).toBeDefined();
  });

  it("localizes integration image text without translating provider content", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Integration
          title="GitHub"
          description="English provider description"
          icon_url="/integrations/github.png"
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("img", { name: "集成图标" })).toBeDefined();
    expect(screen.getByText("Git Hub")).toBeDefined();
    expect(screen.getByText("English provider description")).toBeDefined();
  });

  it("localizes marketplace metadata without changing creator links or titles", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <MarketplaceAgentBlock
          title="English Workflow"
          creator_name="EnglishCreator"
          number_of_runs={27}
          slug="exact-slug"
          loading={false}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("作者： EnglishCreator")).toBeDefined();
    expect(screen.getByText("27 次运行")).toBeDefined();
    expect(screen.getByText("English Workflow")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "工作流页面" }).getAttribute("href"),
    ).toBe("/marketplace/agent/EnglishCreator/exact-slug");
  });

  it("localizes workflow versions and edited timestamps", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <UGCAgentBlock
          title="English Workflow"
          image_url={null}
          version={17}
          edited_time={new Date(Date.now() - 300_000)}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("编辑于 5 分钟前")).toBeDefined();
    expect(screen.getByText("版本 17")).toBeDefined();
    expect(screen.getByText("你的工作流")).toBeDefined();
  });

  it("localizes node search feedback and summaries without changing pin keys", () => {
    const node = {
      data: {
        inputSchema: { properties: { exact_input: {} } },
        outputSchema: { properties: { exact_output: {} } },
      },
    } as unknown as SearchableNode;
    expect(getNodeInputOutputSummary(node, chinese)).toBe(
      "输入：exact_input | 输出：exact_output",
    );
    expect(getNodeInputOutputSummary(node)).toBe(
      "Inputs: exact_input | Outputs: exact_output",
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <GraphSearchContent
          searchQuery="English query"
          onSearchChange={vi.fn()}
          filteredNodes={[]}
          onNodeSelect={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("找到 0 个节点")).toBeDefined();
    expect(screen.getByText("未找到匹配的节点")).toBeDefined();
  });
});
