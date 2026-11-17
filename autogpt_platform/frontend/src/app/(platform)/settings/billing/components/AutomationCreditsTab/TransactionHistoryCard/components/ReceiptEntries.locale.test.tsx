import { test, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ReceiptEntries } from "./ReceiptEntries";
import type { Transaction } from "../helpers";

const transaction = {
  id: "receipt-test",
  amount: -120,
  transaction_type: "USAGE",
  usage_execution_id: "run-original-id",
  charges: [
    {
      id: "charge-1",
      charge_type: "execution_fee",
      amount: -120,
      posted_at: new Date("2026-01-15T10:00:00Z"),
    },
  ],
  charges_truncated: true,
  charges_total_count: 2,
} as Transaction;

function ReceiptExample() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <ReceiptEntries transaction={transaction} />
    </>
  );
}

test("expands localized charges and reference and switches the open content to English", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <ReceiptExample />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "显示费用条目" }));
  expect(screen.getByText("运行费用")).toBeDefined();
  expect(
    screen.getByText("显示 2 条费用记录中的 1 条。总额包含所有费用和调整。"),
  ).toBeDefined();
  await user.click(screen.getByRole("button", { name: "参考信息" }));
  expect(screen.getByText("运行 ID")).toBeDefined();
  expect(screen.getByText("run-original-id")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Execution fee")).toBeDefined();
  expect(screen.getByText("Run ID")).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Hide charge entries" }),
  ).toBeDefined();
});
