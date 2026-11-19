import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/mock-server";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@/tests/integrations/test-utils";
import { TransactionHistoryCard } from "../TransactionHistoryCard";
import { run, topUp } from "./fixtures";

describe("Transaction history snapshot", () => {
  it.each(["en", "zh-CN"] as const)(
    "labels the credit cutoff in %s even when a later page reports a currently completed run",
    async (locale) => {
      const chinese = locale === "zh-CN";
      const snapshot = "2026-09-05T08:14:10Z";
      server.use(
        http.get("*/api/credits/transactions", ({ request }) => {
          const laterPage = new URL(request.url).searchParams.has("cursor");
          return HttpResponse.json({
            transactions: laterPage
              ? [{ ...run, execution_status: "COMPLETED" }]
              : [topUp],
            next_cursor: laterPage ? null : "older-page",
            snapshot_at: snapshot,
          });
        }),
      );
      render(
        <LanguageProvider initialLocale={locale}>
          <TransactionHistoryCard />
        </LanguageProvider>,
      );
      await screen.findByText(chinese ? "积分已充值" : "Credits added");
      fireEvent.click(
        screen.getByRole("button", {
          name: chinese ? /加载更多/ : /Load more/,
        }),
      );
      await screen.findByText("Morning briefing");
      fireEvent.click(
        screen.getByRole("button", {
          name: chinese
            ? /打开 Morning briefing 的详情/
            : /details for Morning briefing/i,
        }),
      );
      const receipt = screen.getByRole("region", {
        name: chinese
          ? "Morning briefing 积分回执"
          : "Morning briefing credit receipt",
      });
      expect(
        within(receipt)
          .getByText(chinese ? "运行状态" : "Run status")
          .closest("div")?.textContent,
      ).toContain(chinese ? "已完成" : "Completed");
      const cutoff = within(receipt)
        .getByText(chinese ? "积分统计截至" : "Credits as of")
        .closest("div");
      expect(cutoff?.querySelector("[title]")?.getAttribute("title")).toBe(
        new Date(snapshot).toLocaleString(locale, {
          dateStyle: "long",
          timeStyle: "long",
        }),
      );
      expect(
        within(receipt).getByText(
          chinese
            ? "此运行已记录的费用和调整。"
            : "Recorded charges and adjustments for this run.",
        ),
      ).toBeDefined();
      expect(within(receipt).queryByText(/All recorded/)).toBeNull();
    },
  );
});
