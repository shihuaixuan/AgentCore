import { expect, test, vi } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  PaywallToastDescription,
  PlanRequiredDescription,
} from "../PaywallToast";

const { billing } = vi.hoisted(() => ({ billing: { enabled: true } }));
vi.mock("@/hooks/useIsBillingEnabled", () => ({
  useIsBillingEnabled: () => billing.enabled,
}));

test("localizes plan recovery copy for both hosted and self-hosted installs", () => {
  billing.enabled = true;
  const { rerender } = render(
    <LanguageProvider>
      <p>
        <PlanRequiredDescription />
      </p>
      <p>
        <PaywallToastDescription recovery="Raw recovery" />
      </p>
    </LanguageProvider>,
  );
  expect(screen.getByText("选择一个套餐以继续。")).toBeDefined();
  expect(
    screen.getByText("选择一个套餐以继续聊天 — Raw recovery。"),
  ).toBeDefined();
  billing.enabled = false;
  rerender(
    <LanguageProvider>
      <p>
        <PlanRequiredDescription />
      </p>
      <p>
        <PaywallToastDescription recovery="Raw recovery" />
      </p>
    </LanguageProvider>,
  );
  expect(screen.getByText("请联系服务器管理员设置套餐。")).toBeDefined();
  expect(
    screen.getByText("请联系服务器管理员设置套餐 — Raw recovery。"),
  ).toBeDefined();
  billing.enabled = true;
});
