import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { NpsCard } from "../NpsCard";
import { OttoMistakeCard } from "../OttoMistakeCard";
import { WorkCheckCard } from "../WorkCheckCard";
import { ReasonFlow } from "../components/ReasonFlow";

test("localizes the NPS scale's accessible name without changing the submitted score or note", () => {
  const onSubmit = vi.fn();
  render(
    <LanguageProvider>
      <NpsCard onSubmit={onSubmit} />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("group", {
      name: "你有多大可能向朋友或同事推荐 AutoGPT？ 从 0（完全不可能）到 10（非常可能）",
    }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "8" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "怎样才能让你打 10 分？" }),
    {
      target: { value: "Keep my English feedback" },
    },
  );
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(onSubmit).toHaveBeenCalledWith({
    score: 8,
    note: "Keep my English feedback",
  });
});

test("localizes work check templates and follow-ups while preserving expert names, notes and reason values", () => {
  const onSubmit = vi.fn();
  render(
    <LanguageProvider>
      <WorkCheckCard
        name="Great"
        avatarUrl={null}
        note="Raw task note"
        onSubmit={onSubmit}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("Great 做得怎么样？")).toBeDefined();
  expect(screen.getByText("Raw task note")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "不满意" }));
  expect(screen.getByText("哪里出了问题？")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "需要我过多干预" }));
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(onSubmit).toHaveBeenCalledWith({ reason: "too_much_help", note: "" });
  expect(screen.getByText("谢谢。团队会认真阅读每一条反馈。")).toBeDefined();
});

test("localizes positive work feedback without translating the expert name", () => {
  render(
    <LanguageProvider>
      <WorkCheckCard name="Great" avatarUrl={null} note="Raw note" />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "很满意" }));
  expect(
    screen.getByText("很高兴听到这个消息。我们会转告 Great。"),
  ).toBeDefined();
});

test("localizes the mistake acknowledgement but preserves caller-supplied acknowledgements", () => {
  const { rerender } = render(
    <LanguageProvider>
      <OttoMistakeCard initialSent />
    </LanguageProvider>,
  );
  expect(screen.getByText("谢谢。团队会认真阅读每一条反馈。")).toBeDefined();
  rerender(
    <LanguageProvider>
      <ReasonFlow
        reasons={[]}
        label="Raw label"
        thanks="Keep my acknowledgement"
        initialSent
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("Keep my acknowledgement")).toBeDefined();
});

test("keeps English work feedback when English is selected", () => {
  render(
    <LanguageProvider initialLocale="en">
      <WorkCheckCard name="Ana" avatarUrl={null} note="Raw note" />
    </LanguageProvider>,
  );
  expect(screen.getByText("How did Ana do?")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Great" }));
  expect(
    screen.getByText("Glad to hear it. We'll pass that on to Ana."),
  ).toBeDefined();
});
