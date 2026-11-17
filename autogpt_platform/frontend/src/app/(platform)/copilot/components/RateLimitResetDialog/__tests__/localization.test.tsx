import { useState } from "react";
import { render, screen, within } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { RateLimitResetDialog } from "../RateLimitResetDialog";

function Harness({ topTier = false }: { topTier?: boolean }) {
  const { setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open limits</button>
      <button onClick={() => setLocale("en")}>English</button>
      <RateLimitResetDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        unavailable={!topTier}
        tier={topTier ? "MAX" : undefined}
        wait={
          topTier
            ? { window: "weekly", resetsAt: new Date(2099, 0, 5, 21, 30) }
            : null
        }
        failureWindow="daily"
        onRetry={() => {}}
      />
    </>
  );
}

it("opens the limit dialog in Chinese and updates its contents after switching to English", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <Harness />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Open limits" }));
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByText("你已达到今日用量上限")).toBeDefined();
  expect(
    dialog.getByText("你的工作已保存。请重试以检查可用额度，然后再继续。"),
  ).toBeDefined();
  expect(dialog.getByRole("button", { name: "重试" })).toBeDefined();
  await user.click(dialog.getByRole("button", { name: "返回工作" }));
  await user.click(screen.getByRole("button", { name: "English" }));
  await user.click(screen.getByRole("button", { name: "Open limits" }));
  const english = within(await screen.findByRole("dialog"));
  expect(english.getByText("You’ve hit today’s limit")).toBeDefined();
  expect(english.getByRole("button", { name: "Try again" })).toBeDefined();
  expect(english.queryByText("你已达到今日用量上限")).toBeNull();
});

it("opens the top-tier weekly reset dialog with Chinese timing and switches it back to English", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <Harness topTier />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Open limits" }));
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByText("你已用完本周预算")).toBeDefined();
  expect(
    dialog.getByText(
      /预算将于星期一 21:30（.*后）重置。你仍可浏览、编辑工作流和查看结果。/,
    ),
  ).toBeDefined();
  expect(dialog.queryByText(/You’re out of budget|It resets/)).toBeNull();
  await user.click(dialog.getByRole("button", { name: "返回工作" }));
  await user.click(screen.getByRole("button", { name: "English" }));
  await user.click(screen.getByRole("button", { name: "Open limits" }));
  const english = within(await screen.findByRole("dialog"));
  expect(english.getByText("You’re out of budget for this week")).toBeDefined();
  expect(
    english.getByText(
      /It resets .*You can still browse, edit workflows and read results./,
    ),
  ).toBeDefined();
});
