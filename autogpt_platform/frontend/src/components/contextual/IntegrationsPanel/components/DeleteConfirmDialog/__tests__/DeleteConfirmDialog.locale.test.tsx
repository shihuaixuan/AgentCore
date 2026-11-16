import { useState } from "react";
import { expect, test } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@/tests/integrations/test-utils";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setOpen(true)}>Open integration removal</button>
      <button onClick={() => setLocale("en")}>English</button>
      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        itemNames={["GitHub key"]}
        onConfirm={() => {}}
      />
    </>
  );
}

test("opens a Chinese removal dialog and switches its content to English", async () => {
  render(
    <LanguageProvider>
      <DialogHarness />
    </LanguageProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Open integration removal" }),
  );
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByText("移除 GitHub key？")).toBeDefined();
  expect(
    dialog.getByText(
      "此操作无法撤销。使用此凭据的专家和工作流将立即失去访问权限。",
    ),
  ).toBeDefined();
  expect(dialog.getByRole("button", { name: "移除" })).toBeDefined();
  fireEvent.click(dialog.getByRole("button", { name: "取消" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Open integration removal" }),
  );
  const englishDialog = within(await screen.findByRole("dialog"));
  expect(englishDialog.getByText("Remove GitHub key?")).toBeDefined();
  expect(
    englishDialog.getByText(
      "This action cannot be undone. Experts and workflows using this credential will lose access immediately.",
    ),
  ).toBeDefined();
  fireEvent.click(englishDialog.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
