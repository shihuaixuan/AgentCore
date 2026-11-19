import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThreadHeader } from "./ThreadHeader";

test("localizes the default header identity, aria label and tooltip consistently", async () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ThreadHeader />
    </LanguageProvider>,
  );

  expect(screen.getByText("Otto")).toBeDefined();
  expect(screen.getByTitle("AI 负责人").textContent).toBe("AI 负责人");
  fireEvent.focus(screen.getByLabelText("Otto — AI 负责人"));
  expect((await screen.findByRole("tooltip")).textContent).toBe("AI 负责人");
});

test("localizes the loading aria label without showing a default identity", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ThreadHeader isResolvingExpertIdentity />
    </LanguageProvider>,
  );

  expect(screen.getByLabelText("正在加载专家")).toBeDefined();
  expect(screen.queryByText("Otto")).toBeNull();
});

test.each([
  { role: "Head of AI", jobTitle: null, expected: "AI 负责人" },
  { role: "Custom AI Lead", jobTitle: null, expected: "Custom AI Lead" },
  { role: "Head of AI", jobTitle: "AI Expert", expected: "AI Expert" },
])(
  "localizes known roles and preserves custom header text in Chinese: $expected",
  async ({ role, jobTitle, expected }) => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ThreadHeader
          expertIdentity={{
            id: "custom-expert",
            name: "Alex",
            avatarUrl: null,
            role,
            jobTitle,
            isArchived: false,
            readOnlyReason: null,
          }}
        />
      </LanguageProvider>,
    );

    expect(screen.getByTitle(expected).textContent).toBe(expected);
    fireEvent.focus(screen.getByLabelText(`Alex — ${expected}`));
    expect((await screen.findByRole("tooltip")).textContent).toBe(expected);
  },
);

test("keeps the default header identity and tooltip in English without a provider", async () => {
  render(<ThreadHeader />);

  expect(screen.getByTitle("Head of AI").textContent).toBe("Head of AI");
  fireEvent.focus(screen.getByLabelText("Otto — Head of AI"));
  expect((await screen.findByRole("tooltip")).textContent).toBe("Head of AI");
});

test("keeps the loading aria label in English without a provider", () => {
  render(<ThreadHeader isResolvingExpertIdentity />);

  expect(screen.getByLabelText("Loading expert")).toBeDefined();
});
