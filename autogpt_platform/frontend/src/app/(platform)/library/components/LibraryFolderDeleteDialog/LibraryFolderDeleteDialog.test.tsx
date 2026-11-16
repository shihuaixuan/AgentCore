import { useState } from "react";
import { test, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@/tests/integrations/test-utils";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { LibraryFolderDeleteDialog } from "./LibraryFolderDeleteDialog";

function FolderActions() {
  const [open, setOpen] = useState(false);
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setOpen(true)}>Open folder actions</button>
      <button onClick={() => setLocale("en")}>English</button>
      <LibraryFolderDeleteDialog
        folder={{
          id: "folder-1",
          user_id: "user-1",
          name: "Project Alpha",
          created_at: new Date(),
          updated_at: new Date(),
        }}
        isOpen={open}
        setIsOpen={setOpen}
      />
    </>
  );
}

test("localizes the opened delete dialog and switches its complete message to English", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <FolderActions />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Open folder actions" }));
  let dialog = within(screen.getByRole("dialog"));
  expect(
    dialog.getByText(
      "确定要删除“Project Alpha”吗？此文件夹中的工作流将移回你的工作流库。",
    ),
  ).toBeDefined();
  await user.click(dialog.getByRole("button", { name: "取消" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "English" }));
  await user.click(screen.getByRole("button", { name: "Open folder actions" }));
  dialog = within(screen.getByRole("dialog"));
  expect(
    dialog.getByText(
      "Are you sure you want to delete “Project Alpha”? Workflows inside this folder will be moved back to your library.",
    ),
  ).toBeDefined();
  await user.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
