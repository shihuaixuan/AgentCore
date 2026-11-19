import { render, screen } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { SecretPasteNotice } from "../../ChatInput/components/SecretPasteNotice";
import { ToolResult } from "../ToolResult";

function Harness() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <SecretPasteNotice visible assistantName="Otto" />
      <ToolResult
        row={{
          key: "result",
          category: "other",
          text: "Tool",
          state: "done",
          output: { success: true },
        }}
      />
      <ToolResult
        row={{
          key: "raw",
          category: "other",
          text: "Tool",
          state: "done",
          output: {
            custom_field: "Keep this English value",
            status: "user supplied status",
          },
        }}
      />
    </>
  );
}

it("switches result labels and the secret notice without translating tool values", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <Harness />
    </LanguageProvider>,
  );
  expect(screen.getByText("已完成")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "市场 → 连接器" }).getAttribute("href"),
  ).toBe("/marketplace/connectors");
  expect(screen.getByText("Keep this English value")).toBeDefined();
  expect(screen.getByText("user supplied status")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("Done")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "Marketplace → Connectors" }),
  ).toBeDefined();
  expect(screen.getByText("Keep this English value")).toBeDefined();
});
