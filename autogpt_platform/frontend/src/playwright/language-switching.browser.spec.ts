import { test, expect } from "./coverage-fixture";

test("keeps the selected language and typed login email after switching", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  const email = page.locator('input[type="email"]');
  await email.fill("localization@example.invalid");
  await page.getByRole("button", { name: "切换为英文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(email).toHaveValue("localization@example.invalid");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page
    .getByRole("button", { name: "Switch to Simplified Chinese", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
