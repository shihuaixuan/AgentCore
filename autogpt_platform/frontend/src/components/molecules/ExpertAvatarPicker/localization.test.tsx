import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/integrations/test-utils";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { ExpertAvatarPicker } from "./ExpertAvatarPicker";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/lib/direct-upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/direct-upload")>();
  return { ...actual, uploadSubmissionMediaDirect: upload };
});

afterEach(cleanup);

test("passes the avatar purpose and locale to uploads while preserving the selected URL", async () => {
  upload.mockClear();
  upload.mockResolvedValueOnce("https://cdn.test/Original.png");
  const onPick = vi.fn();
  render(
    <LanguageProvider>
      <ExpertAvatarPicker
        name="Original name"
        category="finance"
        onPick={onPick}
      />
    </LanguageProvider>,
  );
  const file = new File(["original"], "Original.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("上传头像"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toContain(
      "Original.png",
    ),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "使用此头像" })).toHaveProperty(
      "disabled",
      false,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "使用此头像" }));
  expect(upload).toHaveBeenCalledWith(file, "expert-avatar", "zh-CN");
  expect(onPick).toHaveBeenCalledWith("https://cdn.test/Original.png");
});

test("uses the localized upload size error without uploading an oversized avatar", async () => {
  const onPick = vi.fn();
  const { container } = render(
    <LanguageProvider>
      <ExpertAvatarPicker
        name="Original name"
        category="finance"
        onPick={onPick}
      />
    </LanguageProvider>,
  );
  const file = new File(["raw"], "Original.png", { type: "image/png" });
  Object.defineProperty(file, "size", { value: 25 * 1024 * 1024 });
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
  expect(
    await screen.findByText(/文件过大（25\.0 MB）。最大允许/),
  ).toBeDefined();
  expect(onPick).not.toHaveBeenCalled();
});

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
