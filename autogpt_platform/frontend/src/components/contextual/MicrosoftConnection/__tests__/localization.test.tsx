import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { MicrosoftAccessCheck } from "@/app/api/__generated__/models/microsoftAccessCheck";
import { MicrosoftServiceList } from "../components/MicrosoftServiceList";
import { MicrosoftAdminSetup } from "../MicrosoftAdminSetup";

test("localizes Microsoft access explanations while preserving names and scopes", () => {
  const onAllow = vi.fn();
  const check = {
    capabilities: [
      {
        service: "mail",
        name: "Original mail service",
        status: "permission_needed",
        scopes: ["Mail.ReadWrite"],
      },
    ],
  } as MicrosoftAccessCheck;
  render(
    <LanguageProvider>
      <MicrosoftServiceList
        check={check}
        checking={false}
        browserAvailable
        onAllow={onAllow}
      />
      <MicrosoftAdminSetup reason="admin_consent_required" />
    </LanguageProvider>,
  );
  expect(screen.getByText("Original mail service")).toBeDefined();
  expect(
    screen.queryByText("Your Microsoft administrator needs to approve access."),
  ).toBeNull();
  expect(screen.getByText("需要 Microsoft 管理员批准访问。")).toBeDefined();
  expect(screen.getByText("需要你的授权")).toBeDefined();
  expect(
    screen.getByText("允许 通用办公助手 读取、起草和发送你的电子邮件"),
  ).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: "允许 Original mail service" }),
  );
  expect(onAllow).toHaveBeenCalledWith(["Mail.ReadWrite"]);
});

test("localizes Microsoft access loading and retry states", () => {
  const { rerender } = render(
    <LanguageProvider>
      <MicrosoftServiceList
        checking
        browserAvailable={false}
        onAllow={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("status").textContent).toBe(
    "正在检查此账号可使用的服务…",
  );
  rerender(
    <LanguageProvider>
      <MicrosoftServiceList
        checking={false}
        browserAvailable={false}
        onAllow={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("status").textContent).toBe(
    "无法检查此账号，请稍后重试。",
  );
});
