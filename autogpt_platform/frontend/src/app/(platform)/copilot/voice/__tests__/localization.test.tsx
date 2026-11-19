import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { VoiceModeBar } from "../components/VoiceModeBar";
import { VoiceModeButton } from "../components/VoiceModeButton";
import { describeVoiceState } from "../micStateMachine";

test("localizes voice recovery controls without rewriting raw provider failures", () => {
  const onRetry = vi.fn();
  const onDownload = vi.fn();
  render(
    <LanguageProvider>
      <VoiceModeBar
        state="listening"
        statusLabel="Raw status"
        failure={{ message: "Original API error" }}
        onRetry={onRetry}
        onDownload={onDownload}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("alert").textContent).toBe("Original API error");
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  fireEvent.click(screen.getByRole("button", { name: "下载录音" }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(onDownload).toHaveBeenCalledOnce();
});

test("localizes voice button states and retains English compatibility", () => {
  const onClick = vi.fn();
  const { rerender } = render(
    <LanguageProvider>
      <VoiceModeButton isActive={false} onClick={onClick} />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "开启语音模式" }));
  expect(onClick).toHaveBeenCalledOnce();
  rerender(
    <LanguageProvider>
      <VoiceModeButton isActive speaking onClick={onClick} />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "停止" })).toBeDefined();
  rerender(<VoiceModeButton isActive onClick={onClick} />);
  expect(
    screen.getByRole("button", { name: "Leave voice mode" }),
  ).toBeDefined();
  expect(describeVoiceState("transcribing", "zh-CN")).toBe("正在转写");
  expect(describeVoiceState("transcribing")).toBe("Transcribing");
});
