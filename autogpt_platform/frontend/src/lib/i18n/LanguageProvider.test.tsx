import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LanguageProvider, useTranslation } from "./LanguageProvider";
import { parseLocale, LOCALE_COOKIE_NAME } from "./locale";

afterEach(() => {
  cleanup();
  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
});

function Example() {
  const { t, setLocale } = useTranslation();
  return (
    <>
      <label>
        {t("Name", "名称")}
        <input aria-label="name" defaultValue="" />
      </label>
      <button onClick={() => setLocale("en")}>English</button>
      <button onClick={() => setLocale("zh-CN")}>简体中文</button>
    </>
  );
}

it("defaults to Chinese and preserves input through language changes", () => {
  render(
    <LanguageProvider>
      <Example />
    </LanguageProvider>,
  );
  expect(screen.getByText("名称")).toBeDefined();
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "中文 nihongo" } });
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Name")).toBeDefined();
  expect(input.value).toBe("中文 nihongo");
  expect(document.documentElement.lang).toBe("en");
  expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);
  cleanup();
  render(
    <LanguageProvider initialLocale={parseLocale("en")}>
      <Example />
    </LanguageProvider>,
  );
  expect(screen.getByText("Name")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
  expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=zh-CN`);
  expect(document.documentElement.lang).toBe("zh-CN");
});

it("uses Chinese for missing and unrecognized locale cookies", () => {
  expect(parseLocale(undefined)).toBe("zh-CN");
  expect(parseLocale("invalid")).toBe("zh-CN");
  expect(parseLocale("en")).toBe("en");
});

it("keeps isolated components usable without a provider", () => {
  render(<Example />);
  expect(screen.getByText("Name")).toBeDefined();
});
