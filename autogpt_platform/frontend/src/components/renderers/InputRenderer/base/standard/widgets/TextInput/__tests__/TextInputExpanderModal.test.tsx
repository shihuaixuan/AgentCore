import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@/tests/integrations/test-utils";
import { InputExpanderModal } from "../TextInputExpanderModal";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";

function LocalizedEditor() {
  const [open, setOpen] = useState(false);
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setOpen(true)}>Open editor</button>
      <button onClick={() => setLocale("en")}>English</button>
      <InputExpanderModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={() => {}}
        defaultValue="User supplied text"
      />
    </>
  );
}

vi.mock("@/lib/hooks/useBreakpoint", () => ({
  useBreakpoint: () => "lg",
  isLargeScreen: () => true,
}));

describe("InputExpanderModal", () => {
  test("opens in Chinese and switches the editor actions to English", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LocalizedEditor />
      </LanguageProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Open editor" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("编辑文本")).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "保存" })).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeDefined();
    expect(
      (within(dialog).getByRole("textbox") as HTMLTextAreaElement).value,
    ).toBe("User supplied text");
    await user.click(within(dialog).getByRole("button", { name: "取消" }));
    await user.click(screen.getByRole("button", { name: "English" }));
    await user.click(screen.getByRole("button", { name: "Open editor" }));
    const englishDialog = screen.getByRole("dialog");
    expect(within(englishDialog).getByText("Edit Text")).toBeDefined();
    expect(
      within(englishDialog).getByRole("button", { name: "Save" }),
    ).toBeDefined();
    expect(
      within(englishDialog).getByRole("button", { name: "Cancel" }),
    ).toBeDefined();
  });

  test("renders dialog with provided title", () => {
    render(
      <InputExpanderModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        title="Custom Title"
        defaultValue="hello"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Custom Title")).toBeDefined();
  });

  test("renders dialog with fallback title when title is not provided", () => {
    render(
      <InputExpanderModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        defaultValue="hello"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit Text")).toBeDefined();
  });

  test("renders dialog with fallback title when title is empty string", () => {
    render(
      <InputExpanderModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        title=""
        defaultValue="hello"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit Text")).toBeDefined();
  });

  test("does not render dialog when closed", () => {
    render(
      <InputExpanderModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        defaultValue="hello"
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
