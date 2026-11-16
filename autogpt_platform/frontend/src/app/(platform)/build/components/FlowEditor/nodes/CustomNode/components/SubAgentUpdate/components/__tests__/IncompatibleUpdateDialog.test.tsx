import { useState } from "react";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { describe, expect, test, vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  within,
} from "@/tests/integrations/test-utils";

import { IncompatibleUpdateDialog } from "../IncompatibleUpdateDialog";

const incompatibilities = {
  missingInputs: ["topic"],
  missingOutputs: [],
  newInputs: ["subject"],
  newOutputs: ["summary"],
  newRequiredInputs: ["subject"],
  inputTypeMismatches: [
    { name: "count", oldType: "string", newType: "number" },
  ],
};

function LocalizedUpdate() {
  const [open, setOpen] = useState(false);
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setOpen(true)}>Open update</button>
      <button onClick={() => setLocale("en")}>English</button>
      <IncompatibleUpdateDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        currentVersion={1}
        latestVersion={2}
        agentName="research_helper"
        incompatibilities={incompatibilities}
      />
    </>
  );
}

function renderDialog() {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <IncompatibleUpdateDialog
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      currentVersion={1}
      latestVersion={2}
      agentName="research_helper"
      incompatibilities={incompatibilities}
    />,
  );
  return { onClose, onConfirm };
}

describe("IncompatibleUpdateDialog", () => {
  test("opens complete Chinese update details and switches to English", async () => {
    render(
      <LanguageProvider>
        <LocalizedUpdate />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open update" }));
    const dialog = await screen.findByRole("dialog");
    for (const label of [
      "不兼容的更新",
      "输入变更",
      "输出变更",
      "类型已变更",
      "新增必填输入",
    ])
      expect(within(dialog).getByText(label)).toBeDefined();
    expect(within(dialog).getByText("count (string → number)")).toBeDefined();
    expect(
      within(dialog).getByText(
        "如果继续更新，需要移除失效的连接后才能保存或运行工作流。",
      ),
    ).toBeDefined();
    expect(
      within(dialog).getByRole("button", { name: "仍然更新" }),
    ).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    fireEvent.click(screen.getByRole("button", { name: "Open update" }));
    const englishDialog = await screen.findByRole("dialog");
    expect(
      within(englishDialog).getByText("Incompatible Update"),
    ).toBeDefined();
    fireEvent.click(
      within(englishDialog).getByRole("button", { name: "Update Anyway" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  test("lists every removed, added, retyped and newly required item", async () => {
    renderDialog();
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(/from v1 to v2/)).toBeDefined();
    expect(within(dialog).getByText(/Research Helper/)).toBeDefined();

    const inputs = within(dialog).getByText("Input Changes").parentElement!;
    expect(within(inputs).getByText("topic").tagName).toBe("CODE");
    expect(within(inputs).getByText("subject").tagName).toBe("CODE");

    const outputs = within(dialog).getByText("Output Changes").parentElement!;
    expect(within(outputs).getByText("None")).toBeDefined();
    expect(within(outputs).getByText("summary")).toBeDefined();

    expect(within(dialog).getByText("count (string → number)").tagName).toBe(
      "CODE",
    );
    const required = within(dialog).getByText(
      "These inputs are now required:",
    ).parentElement!;
    expect(within(required).getByText("subject").tagName).toBe("CODE");
  });

  test("confirms and cancels through the footer buttons", async () => {
    const { onClose, onConfirm } = renderDialog();
    fireEvent.click(
      await screen.findByRole("button", { name: "Update Anyway" }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
