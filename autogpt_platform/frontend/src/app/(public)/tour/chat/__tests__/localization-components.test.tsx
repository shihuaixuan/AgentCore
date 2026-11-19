import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SidebarProvider } from "@/components/molecules/Sidebar/Sidebar";
import { Toaster } from "@/components/molecules/Toast/toaster";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@/tests/integrations/test-utils";
import { TourHero } from "../../components/TourHero/TourHero";
import { TourAgentCard } from "../components/TourAgentCard/TourAgentCard";
import { TourArtifactCard } from "../components/TourArtifactCard/TourArtifactCard";
import { TourChatHeader } from "../components/TourChatHeader/TourChatHeader";
import { TourEndCard } from "../components/TourEndCard/TourEndCard";
import { TourPlanCard } from "../components/TourPlanCard/TourPlanCard";
import { TourPromptBar } from "../components/TourPromptBar/TourPromptBar";
import { TourSidebarHeader } from "../components/TourSidebar/components/TourSidebarHeader";
import { getTourScenario } from "../script/tourScenarios";
import { useTourStore } from "../tourStore";

describe("Chinese tour chrome", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTourStore.setState({
      activeScenarioId: "competitor-watch",
      isDemoComplete: false,
      watchedScenarioIds: [],
      isNudgeVisible: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("localizes the landing page without changing destinations or brands", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <TourHero />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "聊聊天，就能构建 AI 工作流" }),
    ).toBeDefined();
    expect(screen.getByText("实时演示，无需注册")).toBeDefined();
    expect(screen.getByText(/Otto.*AutoGPT/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "体验演示" }).getAttribute("href"),
    ).toBe("/tour/chat");
    expect(
      screen.getByRole("link", { name: "查看价格" }).getAttribute("href"),
    ).toBe("https://agpt.co/pricing");
  });

  test("preserves English when rendered outside LanguageProvider", () => {
    render(<TourHero />);
    expect(
      screen.getByRole("heading", { name: "Build AI agents by just chatting" }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "Try the demo" })).toBeDefined();
    expect(screen.queryByText("体验演示")).toBeNull();
  });

  test("localizes plan, run-state and artifact chrome while preserving block identifiers", () => {
    const agent = {
      name: "竞品价格监测",
      schedule: "每天 · 上午 8:00",
      blocks: ["Send Web Request", "Text Compare", "Send Email"],
    };
    const view = render(
      <LanguageProvider initialLocale="zh-CN">
        <TourPlanCard
          plan={{
            goal: "监测价格",
            steps: [{ description: "对比快照", blockName: "Text Compare" }],
          }}
        />
        <TourAgentCard agent={agent} runCompleted={false} />
        <TourArtifactCard
          artifact={{ caption: "发送到你收件箱的内容", title: "价格报告" }}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("构建计划 — 1 个步骤")).toBeDefined();
    expect(screen.getByText("计划如下（共 1 个步骤）：")).toBeDefined();
    expect(screen.getByLabelText("已完成")).toBeDefined();
    expect(screen.getByText("运行中")).toBeDefined();
    expect(
      screen.getByText("每天 · 上午 8:00 · 根据你的一句话创建"),
    ).toBeDefined();
    expect(screen.getByText("产物 · 发送到你收件箱的内容")).toBeDefined();
    expect(screen.getAllByText("Text Compare")).toHaveLength(2);

    view.rerender(
      <LanguageProvider initialLocale="zh-CN">
        <TourAgentCard agent={agent} runCompleted />
      </LanguageProvider>,
    );
    expect(screen.getByText("运行完成")).toBeDefined();
  });

  test("localizes prompt accessibility and keyboard guidance without changing submission", async () => {
    const onSend = vi.fn();
    const view = render(
      <LanguageProvider initialLocale="zh-CN">
        <TourPromptBar
          prompt="开始监测价格"
          isStreaming={false}
          onSend={onSend}
        />
      </LanguageProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("按下")).toBeDefined();
    expect(screen.getByText("Enter")).toBeDefined();
    fireEvent.keyDown(
      screen.getByRole("button", { name: "发送：开始监测价格" }),
      { key: "Enter" },
    );
    expect(onSend).toHaveBeenCalledOnce();

    view.rerender(
      <LanguageProvider initialLocale="zh-CN">
        <TourPromptBar prompt={null} isStreaming onSend={onSend} />
      </LanguageProvider>,
    );
    const busy = screen.getByRole("button", { name: "Otto 正在工作" });
    expect(busy.getAttribute("aria-disabled")).toBe("true");
    fireEvent.keyDown(busy, { key: "Enter" });
    expect(onSend).toHaveBeenCalledOnce();
  });

  test("localizes sidebar controls and share confirmation, preserving the copied URL", async () => {
    const writeText = vi.fn(async (_text: string) => {});
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText,
    } as unknown as Clipboard);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <SidebarProvider>
          <TourSidebarHeader />
          <TourChatHeader
            scenarioLabel="竞品监测"
            scenarioIcon={getTourScenario("competitor-watch").icon}
          />
        </SidebarProvider>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "收起侧边栏" }));
    expect(screen.getByRole("button", { name: "展开侧边栏" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "分享此演示" }));
    await act(async () => {});

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/tour/chat?utm_source=share`,
    );
    expect(screen.getByRole("button", { name: "链接已复制" })).toBeDefined();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByRole("button", { name: "分享此演示" })).toBeDefined();
  });

  test("localizes the completion card and keeps pricing attribution and scenario selection", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <TourEndCard />
      </LanguageProvider>,
    );
    expect(
      screen.getByText("工作流已创建，首次运行已完成 — 60 秒"),
    ).toBeDefined();
    expect(screen.getByText("只用了 60 秒。", { exact: false })).toBeDefined();
    expect(
      screen.getByText("从 Pro 开始 · $42.50/月 · 随时取消"),
    ).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /将此工作流用于你的任务/ })
        .getAttribute("href"),
    ).toBe("https://agpt.co/pricing?utm_source=tour&utm_medium=end_card");
    expect(
      screen.getByRole("link", { name: "或免费自行部署" }).getAttribute("href"),
    ).toBe("https://github.com/Significant-Gravitas/AutoGPT");
    fireEvent.click(screen.getByRole("button", { name: "观看其他场景" }));
    expect(useTourStore.getState().activeScenarioId).toBe("support-queue");
  });

  test("shows a Chinese failure toast with a usable URL when clipboard access is denied", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("Clipboard access denied");
    });
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText,
    } as unknown as Clipboard);
    render(
      <LanguageProvider initialLocale="zh-CN">
        <SidebarProvider>
          <TourChatHeader
            scenarioLabel="竞品监测"
            scenarioIcon={getTourScenario("competitor-watch").icon}
          />
          <Toaster />
        </SidebarProvider>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "分享此演示" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.getByText("无法复制链接")).toBeDefined();
    expect(
      screen.getByText(`${window.location.origin}/tour/chat?utm_source=share`),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "分享此演示" })).toBeDefined();
  });
});
