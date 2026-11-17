import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ExpiredLinkMessage } from "../ExpiredLinkMessage";

afterEach(cleanup);

function Example() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <ExpiredLinkMessage onRequestNewLink={() => {}} />
    </>
  );
}

test("translates the expired password link screen and switches back to English", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <Example />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "获取新链接" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("button", { name: "Request a New Link" }),
  ).toBeDefined();
});
