import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { VoicePicker } from "../VoicePicker";

test("submits custom voice text unchanged through Chinese controls", async () => {
  const onPick = vi.fn();
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <VoicePicker samples={[]} onPick={onPick} onSkip={vi.fn()} />
    </LanguageProvider>,
  );
  const submit = screen.getByRole("button", { name: "使用此风格" });
  expect(submit.hasAttribute("disabled")).toBe(true);
  const input = screen.getByRole("textbox", { name: "自定义写作风格示例" });
  await user.type(input, "保留我的表达 Keep it breezy.");
  expect((input as HTMLTextAreaElement).value).toBe(
    "保留我的表达 Keep it breezy.",
  );
  await user.click(submit);
  expect(onPick).toHaveBeenCalledWith({
    choice: "custom",
    customText: "保留我的表达 Keep it breezy.",
  });
});
