import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { NoModelNotice } from "../components/BuilderChatPanel/components/NoModelNotice";
import { PanelHeader } from "../components/BuilderChatPanel/components/PanelHeader";
import { NodeAdvancedToggle } from "../components/FlowEditor/nodes/CustomNode/components/NodeAdvancedToggle";
import { useNodeStore } from "../stores/nodeStore";

describe("builder localized controls", () => {
  it("announces the missing connection and preserves the setup link in Chinese", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <NoModelNotice />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("status", { name: "未连接 AI 模型" }),
    ).toBeDefined();
    expect(screen.getByText(/添加模型 API 密钥或本地模型/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "（配置指南）" }).getAttribute("href"),
    ).toContain("https://");
  });

  it("localizes the revert target without changing the action or version", () => {
    const onRevert = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <PanelHeader
          onClose={vi.fn()}
          canRevert
          revertTargetVersion={17}
          onRevert={onRevert}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "恢复到版本 17" }));
    expect(onRevert).toHaveBeenCalledOnce();
  });

  it("toggles advanced fields using the untranslated node ID", () => {
    const nodeID = "english-node-ID";
    useNodeStore.setState({ nodeAdvancedStates: {} });
    render(
      <LanguageProvider initialLocale="zh-CN">
        <NodeAdvancedToggle nodeId={nodeID} />
      </LanguageProvider>,
    );

    const button = screen.getByRole("button", { name: "高级选项" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(useNodeStore.getState().nodeAdvancedStates[nodeID]).toBe(true);
  });

  it("retains English labels without a language provider", () => {
    render(<NoModelNotice />);
    expect(
      screen.getByRole("status", { name: "No AI connection" }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "(setup guide)" })).toBeDefined();
  });
});
