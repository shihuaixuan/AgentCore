import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useWorkspaceUpload } from "../useWorkspaceUpload";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/lib/direct-upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/direct-upload")>();
  return { ...actual, uploadFileDirect: upload };
});

const file = new File(["original"], "Original.txt", { type: "text/plain" });

function UploadExample() {
  const { handleUploadFile } = useWorkspaceUpload();
  return (
    <button onClick={() => void handleUploadFile(file)}>Upload example</button>
  );
}

test("passes the selected locale to workspace uploads without inventing a session ID", () => {
  upload.mockResolvedValue({
    file_id: "Original-id",
    name: file.name,
    path: "Original.txt",
    mime_type: file.type,
    size_bytes: file.size,
  });
  render(
    <LanguageProvider>
      <UploadExample />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Upload example" }));
  expect(upload).toHaveBeenCalledWith(file, undefined, "zh-CN");
});
