import { test, expect } from "./coverage-fixture";

test("shows Chinese without a language switcher even with a saved English preference", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "autogpt-locale", value: "en", url: baseURL! },
  ]);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator('[data-slot="language-switcher"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
