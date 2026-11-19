import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { useCopilotUIStore } from "@/app/(platform)/copilot/store";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@/tests/integrations/test-utils";
import TourChatPage from "../page";
import { useTourStore } from "../tourStore";

vi.mock("../components/DotDistortionShader/DotDistortionShader", () => ({
  DotDistortionShader: () => null,
}));

function LanguageSwitch() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("zh-CN")}>简体中文</button>;
}

async function advancePlayback(milliseconds = 16_000) {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 200) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
  }
}

describe("Chinese scripted tour playback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTourStore.setState({
      activeScenarioId: "competitor-watch",
      runId: 0,
      isDemoComplete: false,
      watchedScenarioIds: [],
      isNudgeVisible: false,
    });
    useCopilotUIStore.getState().closeArtifactPanel({ persist: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    useCopilotUIStore.getState().closeArtifactPanel({ persist: false });
    document.cookie = "autogpt-locale=; path=/; max-age=0";
  });

  test("plays the Chinese plan and result, exports Chinese markdown, then selects a Chinese scenario", async () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <TourChatPage />
      </LanguageProvider>,
    );
    expect(screen.getByText("竞品监测")).toBeDefined();
    expect(
      screen.getByText("模拟演示 — 注册后，让 Otto 处理你的真实任务。"),
    ).toBeDefined();
    await advancePlayback(1_600);
    fireEvent.keyDown(screen.getByRole("button", { name: /^发送：/ }), {
      key: "Enter",
    });
    expect(screen.getByRole("status").textContent).toContain("思考中…");
    await advancePlayback();
    expect(screen.getByText(/与上次快照对比，检测变化/)).toBeDefined();
    fireEvent.keyDown(
      screen.getByRole("button", { name: "发送：好的，帮我构建并运行" }),
      { key: "Enter" },
    );
    await advancePlayback();

    expect(screen.getByText("检测到价格变化 — 竞品 Pro 方案")).toBeDefined();
    expect(screen.getByText("$59/月")).toBeDefined();
    expect(screen.getByText("+20.4%")).toBeDefined();
    expect(screen.getByText('"competitor-pricing-report.md"')).toBeDefined();
    expect(screen.getByText(/即将显示在右侧。/)).toBeDefined();
    expect(screen.queryByText(/Simulated demo/)).toBeNull();
    expect(screen.queryByRole("button", { name: /^发送：/ })).toBeNull();

    const artifact = useCopilotUIStore.getState().artifactPanel.activeArtifact;
    expect(artifact?.id).toBe("tour-competitor-watch");
    expect(
      decodeURIComponent(artifact?.sourceUrl?.split(",")[1] ?? ""),
    ).toContain("## 📈 变化内容");
    expect(useTourStore.getState().watchedScenarioIds).toEqual([
      "competitor-watch",
    ]);

    fireEvent.click(screen.getByRole("button", { name: "观看其他场景" }));
    expect(screen.getByText("客服工单")).toBeDefined();
    expect(useCopilotUIStore.getState().artifactPanel.isOpen).toBe(false);
    await advancePlayback();
    expect(
      screen.getByText("对新客服工单分类，并为常见问题起草回复"),
    ).toBeDefined();
    expect(screen.getByText(/判断紧急程度并起草回复/)).toBeDefined();
  });

  test("does not keep the English script or its pending timers after changing to Chinese", async () => {
    render(
      <LanguageProvider initialLocale="en">
        <LanguageSwitch />
        <TourChatPage />
      </LanguageProvider>,
    );
    await advancePlayback();
    expect(
      screen.getByText("Great goal! Let me break that down into steps."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
    await advancePlayback();

    expect(
      screen.getByText("目标很明确！让我把它拆分为几个步骤。"),
    ).toBeDefined();
    expect(
      screen.queryByText("Great goal! Let me break that down into steps."),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "发送：好的，帮我构建并运行" }),
    ).toBeDefined();
    expect(useTourStore.getState().watchedScenarioIds).toEqual([]);
  });

  test("changing language after completion clears the old artifact and reopens the prompt", async () => {
    render(
      <LanguageProvider initialLocale="en">
        <LanguageSwitch />
        <TourChatPage />
      </LanguageProvider>,
    );
    await advancePlayback();
    fireEvent.keyDown(screen.getByRole("button", { name: /^Send:/ }), {
      key: "Enter",
    });
    await advancePlayback();
    expect(useTourStore.getState().isDemoComplete).toBe(true);
    expect(useCopilotUIStore.getState().artifactPanel.isOpen).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
    expect(useTourStore.getState().isDemoComplete).toBe(false);
    expect(useCopilotUIStore.getState().artifactPanel.isOpen).toBe(false);
    await advancePlayback();
    expect(
      screen.getByRole("button", { name: "发送：好的，帮我构建并运行" }),
    ).toBeDefined();
  });
});
