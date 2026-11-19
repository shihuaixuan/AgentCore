import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SignupMarketingPanel } from "../components/SignupMarketingPanel";

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

it("localizes signup marketing and switches back to English", () => {
  render(
    <LanguageProvider>
      <SwitchLanguage />
      <SignupMarketingPanel />
    </LanguageProvider>,
  );
  expect(screen.getByText("你的抱负")).toBeDefined();
  expect(screen.getByText("值得拥有")).toBeDefined();
  expect(screen.getByText("一支团队。")).toBeDefined();
  expect(screen.getByText("每项工作都有专属专家")).toBeDefined();
  expect(screen.getByText("他们会学习你的方式")).toBeDefined();
  expect(screen.getByText("你始终掌握决定权")).toBeDefined();
  expect(screen.getByText("连接你已经在用的工具")).toBeDefined();
  expect(screen.getByText(/Otto 是你的 AI 负责人/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Your ambition")).toBeDefined();
  expect(screen.getByText("A specialist for every job")).toBeDefined();
});

it("keeps English marketing available outside LanguageProvider", () => {
  render(<SignupMarketingPanel />);
  expect(screen.getByText("Your ambition")).toBeDefined();
  expect(screen.getByText("They learn your way")).toBeDefined();
  expect(screen.getByText("You stay in charge")).toBeDefined();
});
