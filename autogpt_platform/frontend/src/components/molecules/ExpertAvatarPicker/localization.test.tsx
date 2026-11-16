import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ExpertAvatarPicker } from "./ExpertAvatarPicker";

afterEach(cleanup);

function Example({ onPick }: { onPick: (url: string) => void }) {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <ExpertAvatarPicker name="Nova" category="finance" onPick={onPick} />
    </>
  );
}

test("translates avatar actions and preserves the selected avatar when switching", async () => {
  const onPick = vi.fn();
  render(
    <LanguageProvider>
      <Example onPick={onPick} />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "上传图片" })).toBeDefined();
  expect(screen.getByRole("button", { name: "重新生成" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "使用此头像" }));
  const selected = onPick.mock.calls[0][0];
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "Use this avatar" }));
  expect(onPick.mock.calls[1][0]).toBe(selected);
  expect(
    screen.getByRole("button", { name: "Upload a picture" }),
  ).toBeDefined();
});
