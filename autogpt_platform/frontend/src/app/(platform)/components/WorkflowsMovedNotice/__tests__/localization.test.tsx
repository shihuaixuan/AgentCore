import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowsMovedDialog } from "../WorkflowsMovedDialog";
import { WorkflowsMovedWalkthrough } from "../WorkflowsMovedWalkthrough";

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event("pause"));
  });
});

afterEach(() => vi.restoreAllMocks());

describe("workflow migration localization", () => {
  it("localizes the destination while preserving Otto and the workflow URL", async () => {
    const onDismiss = vi.fn();
    render(
      <LanguageProvider>
        <WorkflowsMovedDialog isOpen onDismiss={onDismiss} />
      </LanguageProvider>,
    );

    const dialog = within(
      screen.getByRole("dialog", { name: "你的智能体已迁移" }),
    );
    expect(dialog.getByText("工作区更新")).toBeDefined();
    expect(dialog.getByText("无需重新设置。")).toBeDefined();
    expect(dialog.getByRole("list", { name: "工作流位置" }).textContent).toBe(
      "团队Otto工作流",
    );
    const destination = dialog.getByRole("link", { name: "前往我的工作流" });
    expect(destination.getAttribute("href")).toBe(
      "/team/autopilot?tab=workflows",
    );
    expect(dialog.getByRole("button", { name: "关闭通知" })).toBeDefined();
    expect(dialog.getByRole("button", { name: "知道了" })).toBeDefined();
    await userEvent.click(destination);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("localizes playback states and returns to English without replacing the media", async () => {
    render(
      <LanguageProvider>
        <SwitchLanguage />
        <WorkflowsMovedWalkthrough />
      </LanguageProvider>,
    );
    const video = screen.getByLabelText<HTMLVideoElement>("如何找到工作流");
    expect(video.getAttribute("src")).toBe("/videos/workflows-moved.mp4");
    expect(video.getAttribute("poster")).toBe(
      "/videos/workflows-moved-poster.webp",
    );
    expect(
      document.getElementById(video.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toContain("在侧边栏打开“团队”");
    expect(screen.getByText("无需声音")).toBeDefined();
    Object.defineProperty(video, "duration", { configurable: true, value: 65 });
    fireEvent.loadedMetadata(video);
    expect(screen.getByLabelText("视频时长").textContent).toBe("1:05");

    await userEvent.click(screen.getByRole("button", { name: "播放演示" }));
    await screen.findByRole("button", { name: "暂停演示" });
    fireEvent.ended(video);
    expect(screen.getByRole("button", { name: "重播演示" })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.getByRole("button", { name: "Replay walkthrough" }),
    ).toBeDefined();
    expect(screen.getByLabelText("How to find your workflows")).toBe(video);
  });

  it("localizes a missing-video fallback", () => {
    render(
      <LanguageProvider>
        <WorkflowsMovedWalkthrough />
      </LanguageProvider>,
    );
    fireEvent.error(screen.getByLabelText("如何找到工作流"));
    expect(screen.getByRole("status").textContent).toBe(
      "无法加载演示。请打开“团队”，选择 Otto，再选择“工作流”。",
    );
  });

  it("localizes a rejected play request without removing its retry control", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new Error("Playback blocked"),
    );
    render(
      <LanguageProvider>
        <WorkflowsMovedWalkthrough />
      </LanguageProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "播放演示" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "视频无法开始播放。请重试，或打开“团队”，选择 Otto，再选择“工作流”。",
      ),
    );
    expect(screen.getByRole("button", { name: "播放演示" })).toBeDefined();
  });
});
