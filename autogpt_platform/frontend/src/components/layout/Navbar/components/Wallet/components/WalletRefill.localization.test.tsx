import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { WalletRefill } from "./WalletRefill";

const updateAutoTopUpConfig = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
vi.mock("@/hooks/useCredits", () => ({
  default: () => ({
    autoTopUpConfig: null,
    updateAutoTopUpConfig,
    requestTopUp: vi.fn(),
  }),
}));

test("localizes billing guidance and auto-refill validation without changing cent amounts", async () => {
  render(
    <LanguageProvider>
      <WalletRefill />
    </LanguageProvider>,
  );
  expect(screen.getByText("如需更新账单信息，请前往")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "账单设置" }).getAttribute("href"),
  ).toBe("/settings/billing");
  fireEvent.mouseDown(screen.getByRole("tab", { name: "自动充值" }), {
    button: 0,
    ctrlKey: false,
  });
  const threshold = await screen.findByLabelText("余额低于以下金额时充值：");
  const amount = screen.getByLabelText("充值金额：");
  fireEvent.change(threshold, { target: { value: "4" } });
  fireEvent.change(amount, { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "启用自动充值" }));
  expect(
    await screen.findByText("自动充值的余额阈值过低，请设置为 5 美元或以上。"),
  ).toBeDefined();
  expect(updateAutoTopUpConfig).not.toHaveBeenCalled();
  fireEvent.change(threshold, { target: { value: "10" } });
  fireEvent.change(amount, { target: { value: "15" } });
  fireEvent.click(screen.getByRole("button", { name: "启用自动充值" }));
  await waitFor(() =>
    expect(updateAutoTopUpConfig).toHaveBeenCalledWith(1500, 1000),
  );
});
