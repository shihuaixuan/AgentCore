import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@/tests/integrations/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

// These cover the hosted billing UI, which self-hosted builds hide.
vi.mock("@/hooks/useIsBillingEnabled", () => ({
  useIsBillingEnabled: () => true,
  useBillingStatus: () => ({ isBillingEnabled: true, isResolved: true }),
}));

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(() => "/settings/billing"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: usePathnameMock,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }: MockLinkProps) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
  useLinkStatus: () => ({ pending: false }),
}));

import { SettingsMobileNav } from "../components/SettingsMobileNav/SettingsMobileNav";

describe("SettingsMobileNav", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/settings/billing");
  });

  it("trigger shows the current page label", () => {
    render(<SettingsMobileNav />);

    const trigger = screen.getByRole("button", {
      name: /settings navigation/i,
    });
    expect(trigger.textContent).toContain("Billing");
  });

  it("opens popover listing all 8 current sections on click", async () => {
    render(<SettingsMobileNav />);

    fireEvent.click(
      screen.getByRole("button", { name: /settings navigation/i }),
    );

    const labels = [
      "Profile",
      "Account",
      "Memory",
      "Billing",
      "AI connections",
      "Bots",
      "AutoGPT API Keys",
      "Creator Dashboard",
    ];
    for (const label of labels) {
      expect(
        await screen.findByRole("link", { name: new RegExp(label, "i") }),
      ).toBeDefined();
    }
  });

  it("localizes the current section and keeps the AI connections destination", async () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <SettingsMobileNav />
      </LanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "设置导航，当前：账单" }),
    );

    expect(
      (await screen.findByRole("link", { name: "AI 连接" })).getAttribute(
        "href",
      ),
    ).toBe("/settings/ai-connections");
    expect(screen.getByRole("link", { name: "记忆" })).toBeDefined();
    expect(screen.getByRole("link", { name: "机器人" })).toBeDefined();
  });

  it("selecting an item closes the popover", async () => {
    render(<SettingsMobileNav />);

    fireEvent.click(
      screen.getByRole("button", { name: /settings navigation/i }),
    );

    const profileLink = await screen.findByRole("link", { name: /profile/i });
    fireEvent.click(profileLink);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /creator dashboard/i }),
      ).toBeNull();
    });
  });
});
