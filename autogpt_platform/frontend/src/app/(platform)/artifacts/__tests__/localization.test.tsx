import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { OfficePreview } from "../components/FileViewerModal/components/OfficePreview";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";

const file: WorkspaceFileItem = {
  id: "original-id",
  name: "Original presentation.pptx",
  mime_type:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  size_bytes: 100,
  path: "/files/Original presentation.pptx",
  origin: "uploaded",
  created_at: "2026-11-01T00:00:00Z",
};

function Example() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <OfficePreview file={file} downloadUrl="/original-download" />
    </>
  );
}

test("translates office preview guidance and preserves file names and download destinations", () => {
  render(
    <LanguageProvider>
      <Example />
    </LanguageProvider>,
  );
  expect(
    screen.getByText("当前显示第一张幻灯片。下载后可查看完整演示文稿。"),
  ).toBeDefined();
  expect(screen.getByRole("img", { name: file.name })).toBeDefined();
  expect(screen.getByRole("link", { name: "下载" }).getAttribute("href")).toBe(
    "/original-download",
  );
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByText(
      "Showing the first slide. Download to open the full presentation.",
    ),
  ).toBeDefined();
  expect(screen.getByRole("img", { name: file.name })).toBeDefined();
});

test("translates document preview guidance independently of presentation type labels", () => {
  render(
    <LanguageProvider>
      <OfficePreview
        file={{
          ...file,
          name: "Original.docx",
          mime_type:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }}
        downloadUrl="/document-download"
      />
    </LanguageProvider>,
  );
  expect(
    screen.getByText("当前显示第一页。下载后可查看完整文件。"),
  ).toBeDefined();
});
