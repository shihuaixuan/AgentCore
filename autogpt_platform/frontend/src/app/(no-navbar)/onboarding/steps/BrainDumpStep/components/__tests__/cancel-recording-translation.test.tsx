import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { CancelRecordingDialog } from "../RecordingControls/CancelRecordingDialog";

afterEach(cleanup);

function RecordingExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [discarded, setDiscarded] = useState(false);
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开确认框</button>
      <button onClick={() => setLocale("en")}>English</button>
      {discarded && <p>录音已丢弃</p>}
      <CancelRecordingDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={() => {
          setDiscarded(true);
          setIsOpen(false);
        }}
      />
    </>
  );
}

test("keeps or discards a recording using Chinese controls and supports English", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <RecordingExample />
    </LanguageProvider>,
  );
  expect(
    await screen.findByRole("dialog", { name: "丢弃录音？" }),
  ).toBeDefined();
  expect(
    screen.getByText(
      "这将永久删除当前录音。你可以继续录音，也可以丢弃后重新开始。",
    ),
  ).toBeDefined();
  await user.click(screen.getByRole("button", { name: "继续录音" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("录音已丢弃")).toBeNull();
  await user.click(screen.getByRole("button", { name: "打开确认框" }));
  await user.click(await screen.findByRole("button", { name: "丢弃录音" }));
  expect(screen.getByText("录音已丢弃")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "English" }));
  await user.click(screen.getByRole("button", { name: "打开确认框" }));
  expect(
    await screen.findByRole("dialog", { name: "Discard recording?" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Keep recording" })).toBeDefined();
});
