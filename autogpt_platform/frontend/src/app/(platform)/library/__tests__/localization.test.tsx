import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { FavoriteButton } from "../components/LibraryAgentCard/components/FavoriteButton";
import { RunActions } from "../agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentModal/components/RunActions/RunActions";
import { RunAgentInputs } from "../agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentInputs/RunAgentInputs";
import { StatusBadge } from "../components/StatusBadge/StatusBadge";
import { useLibrarySortMenu } from "../components/LibrarySortMenu/useLibrarySortMenu";
import { LibraryAgentSort } from "@/app/api/__generated__/models/libraryAgentSort";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WebhookTriggerSection } from "../agents/[id]/components/NewAgentLibraryView/components/selected-views/SelectedRunView/components/WebhookTriggerSection";
import type { LibraryAgentPreset } from "@/app/api/__generated__/models/libraryAgentPreset";
import type { GraphTriggerInfo } from "@/app/api/__generated__/models/graphTriggerInfo";

vi.mock(
  "../agents/[id]/components/NewAgentLibraryView/components/modals/RunAgentInputs/useRunAgentInputs",
  () => ({
    useRunAgentInputs: () => ({ handleUploadFile: vi.fn(), uploadProgress: 0 }),
  }),
);

describe("library localized actions and input defaults", () => {
  it("offers a Chinese task action while preserving its callback", () => {
    const onRun = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <RunActions
          defaultRunType="manual"
          onRun={onRun}
          onSimulate={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole("button", { name: "模拟运行" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "开始任务" }));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("keeps the trigger API variant and disables an unready Chinese action", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <RunActions
          defaultRunType="automatic-trigger"
          onRun={vi.fn()}
          isRunReady={false}
        />
      </LanguageProvider>,
    );

    expect(
      (screen.getByRole("button", { name: "设置触发器" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "开始任务" })).toBeNull();
  });

  it("announces favorite removal in Chinese", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <FavoriteButton isFavorite onClick={vi.fn()} />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: "取消收藏" })).toBeDefined();
  });

  it("localizes an input placeholder but not a user-authored title or value", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLocale="zh-CN">
        <RunAgentInputs
          schema={{ type: "string", title: "Customer English title" }}
          value="Customer English data"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    const input = screen.getByPlaceholderText("请输入文本") as HTMLInputElement;
    expect(input.value).toBe("Customer English data");
    expect(
      screen.getByRole("textbox", { name: "Customer English title" }),
    ).toBeDefined();
    fireEvent.change(input, { target: { value: "New English data" } });
    expect(onChange).toHaveBeenCalledWith("New English data");
  });

  it("preserves English fallback labels without a provider", () => {
    render(
      <RunActions
        defaultRunType="manual"
        onRun={vi.fn()}
        onSimulate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Simulate" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Start Task" })).toBeDefined();
  });

  it("localizes status and sort data without changing enum values", () => {
    function wrapper({ children }: { children: ReactNode }) {
      return (
        <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
      );
    }
    const setLibrarySort = vi.fn();
    const { result } = renderHook(
      () => useLibrarySortMenu({ setLibrarySort }),
      { wrapper },
    );
    expect(result.current.getSortLabel(LibraryAgentSort.lastRunAt)).toBe(
      "上次运行",
    );
    result.current.handleSortChange(LibraryAgentSort.lastRunAt);
    expect(setLibrarySort).toHaveBeenCalledWith(LibraryAgentSort.lastRunAt);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <StatusBadge status="listening" />
      </LanguageProvider>,
    );
    expect(screen.getByText("监听中")).toBeDefined();
  });

  it("localizes trigger status and guidance while preserving webhook URLs", () => {
    const preset = {
      webhook_id: "exact-webhook-id",
      is_active: true,
      webhook: { url: "https://example.com/English-webhook-ID" },
    } as LibraryAgentPreset;
    render(
      <LanguageProvider initialLocale="zh-CN">
        <WebhookTriggerSection
          preset={preset}
          triggerSetupInfo={{} as GraphTriggerInfo}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("已启用")).toBeDefined();
    expect(screen.getByText(/使用下方的 Webhook 地址/)).toBeDefined();
    expect(
      screen.getByText("https://example.com/English-webhook-ID"),
    ).toBeDefined();
  });
});
