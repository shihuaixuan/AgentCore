import { CreditTransactionType } from "@/lib/autogpt-server-api";
import type { Locale } from "@/lib/i18n/locale";
import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test, vi } from "vitest";
import { AdminUserGrantHistory } from "../components/AdminUserGrantHistory";

const serverLocale = vi.hoisted(() => ({ value: "en" as Locale }));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslation: async () => ({
    locale: serverLocale.value,
    t: (en: string, zh: string) => (serverLocale.value === "zh-CN" ? zh : en),
  }),
}));

vi.mock("../actions", () => ({
  getUsersTransactionHistory: async () => ({
    history: [
      {
        transaction_key: "original-transaction",
        transaction_time: new Date(2026, 2, 12, 15, 4),
        transaction_type: CreditTransactionType.GRANT,
        amount: 100,
        current_balance: 100,
        running_balance: 100,
        user_id: "original-user",
        user_email: "Original.User@example.com",
        reason: "Original reason",
        admin_email: "Original.Admin@example.com",
      },
    ],
    pagination: { total_pages: 1 },
  }),
}));

vi.mock("../components/SearchAndFilterAdminSpending", () => ({
  SearchAndFilterAdminSpending: () => null,
}));
vi.mock("../components/AddMoneyButton", () => ({
  AdminAddMoneyButton: () => null,
}));
vi.mock("../components/RateLimitModal", () => ({
  RateLimitModal: () => null,
}));
vi.mock("@/components/molecules/PaginationControls/PaginationControls", () => ({
  PaginationControls: () => null,
}));

describe.each([
  { locale: "zh-CN" as Locale, date: "2026年3月12日 15:04" },
  { locale: "en" as Locale, date: "Mar 12, 2026, 3:04 PM" },
])("$locale grant history dates", ({ locale, date }) => {
  test("uses the server locale for the date without translating transaction data", async () => {
    serverLocale.value = locale;
    render(await AdminUserGrantHistory({}));
    expect(screen.getByText(date)).toBeDefined();
    expect(screen.getByText("Original.User@example.com")).toBeDefined();
    expect(screen.getByText("Original reason")).toBeDefined();
    expect(screen.getByText("GRANT")).toBeDefined();
  });
});
