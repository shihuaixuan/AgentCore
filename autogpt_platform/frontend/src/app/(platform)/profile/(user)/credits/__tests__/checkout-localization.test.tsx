import { Toaster } from "@/components/molecules/Toast/toaster";
import { BackendAPIProvider } from "@/lib/autogpt-server-api/context";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { toast as sonnerToast } from "sonner";
import CreditsPage from "../page";

const navigation = vi.hoisted(() => ({
  search: "topup=success",
  router: { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => "/profile/credits",
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/hooks/useCredits", () => ({
  default: () => ({
    requestTopUp: vi.fn(),
    autoTopUpConfig: null,
    updateAutoTopUpConfig: vi.fn(),
    transactionHistory: { transactions: [], next_transaction_time: null },
    fetchTransactionHistory: vi.fn(),
    formatCredits: (amount: number) => String(amount),
    refundTopUp: vi.fn(),
    refundRequests: [],
  }),
}));
vi.mock("@/app/api/__generated__/endpoints/chat/chat", () => ({
  useGetV2GetCopilotUsage: () => ({ isSuccess: false }),
}));
vi.mock(
  "../components/SubscriptionTierSection/SubscriptionTierSection",
  () => ({
    SubscriptionTierSection: () => null,
  }),
);
vi.mock("../RefundModal", () => ({ RefundModal: () => null }));

function LanguageSwitch() {
  const { locale, setLocale } = useTranslation();
  return (
    <button onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}>
      Switch language
    </button>
  );
}

function CheckoutPage() {
  return (
    <BackendAPIProvider>
      <LanguageProvider initialLocale="en">
        <LanguageSwitch />
        <CreditsPage />
        <Toaster />
      </LanguageProvider>
    </BackendAPIProvider>
  );
}

beforeEach(() => {
  navigation.search = "topup=success";
});
afterEach(() => sonnerToast.dismiss());

describe("checkout fulfillment locale independence", () => {
  test("switching languages does not repeat a successful checkout fulfillment", async () => {
    let requests = 0;
    server.use(
      http.patch("*/api/credits", () => {
        requests += 1;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    render(<CheckoutPage />);
    await waitFor(() => expect(requests).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(await screen.findByRole("heading", { name: "账单" })).toBeDefined();
    await act(async () => undefined);
    expect(requests).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(
      await screen.findByRole("heading", { name: "Billing" }),
    ).toBeDefined();
    await act(async () => undefined);
    expect(requests).toBe(1);
  });

  test("an in-flight fulfillment failure uses the latest language without sending again", async () => {
    let requests = 0;
    let finish = () => {};
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    server.use(
      http.patch("*/api/credits", async () => {
        requests += 1;
        await pending;
        return HttpResponse.json(
          { detail: "Original checkout error" },
          { status: 503 },
        );
      }),
    );
    render(<CheckoutPage />);
    try {
      await waitFor(() => expect(requests).toBe(1));
      fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
      await screen.findByRole("heading", { name: "账单" });
      await act(async () => undefined);
      expect(requests).toBe(1);
    } finally {
      finish();
    }
    expect(await screen.findByText("无法完成结账")).toBeDefined();
    expect(await screen.findByText("Original checkout error")).toBeDefined();
    expect(requests).toBe(1);
  });

  test("only a successful checkout status triggers fulfillment, not a language change", async () => {
    let requests = 0;
    navigation.search = "topup=cancel";
    server.use(
      http.patch("*/api/credits", () => {
        requests += 1;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const view = render(<CheckoutPage />);
    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    await act(async () => undefined);
    expect(requests).toBe(0);

    navigation.search = "topup=success";
    view.rerender(<CheckoutPage />);
    await waitFor(() => expect(requests).toBe(1));
  });
});
