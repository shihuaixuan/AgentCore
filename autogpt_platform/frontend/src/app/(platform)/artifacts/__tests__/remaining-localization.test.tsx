import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { getListExpertIdentitiesMockHandler } from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { server } from "@/mocks/mock-server";
import { render, screen } from "@/tests/integrations/test-utils";
import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vitest";
import { FileRow } from "../components/ArtifactsList/ArtifactsTable/FileRow";
import { IcsPreview } from "../components/ArtifactsList/ArtifactCard/StructuredPreviews";
import { FolderActionsMenu } from "../components/WorkspaceFolders/FolderActionsMenu";

const file: WorkspaceFileItem = {
  id: "original-file",
  name: "Original 自定义.txt",
  mime_type: "text/plain",
  size_bytes: 100,
  path: "/files/Original 自定义.txt",
  origin: "uploaded",
  created_at: "2026-11-01T00:00:00Z",
};

describe.each([
  {
    locale: "zh-CN" as Locale,
    select: "选择 Original 自定义.txt",
    rename: "重命名 Original 自定义.txt",
    actions: "Original 自定义.txt 的操作",
    folder: "Original Folder 的操作",
    event: "日程",
    weekday: "周一",
    time: "15:30–16:30",
  },
  {
    locale: "en" as Locale,
    select: "Select Original 自定义.txt",
    rename: "Rename Original 自定义.txt",
    actions: "Actions for Original 自定义.txt",
    folder: "Actions for Original Folder",
    event: "Event",
    weekday: "Mon",
    time: "3:30–4:30 PM",
  },
])(
  "$locale artifact controls",
  ({ locale, select, rename, actions, folder, event, weekday, time }) => {
    test("localizes file and folder accessible actions while preserving names and selection", () => {
      server.use(getListExpertIdentitiesMockHandler([]));
      const onToggleSelect = vi.fn();
      render(
        <LanguageProvider initialLocale={locale}>
          <ul>
            <FileRow
              file={file}
              onOpen={vi.fn()}
              isSelected
              selectedIds={[file.id]}
              onToggleSelect={onToggleSelect}
            />
          </ul>
          <FolderActionsMenu
            folderName="Original Folder"
            onRename={vi.fn()}
            onMove={vi.fn()}
            onDelete={vi.fn()}
          />
        </LanguageProvider>,
      );

      expect(
        screen
          .getByRole("button", { name: select })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(screen.getByRole("button", { name: rename })).toBeDefined();
      expect(screen.getByRole("button", { name: actions })).toBeDefined();
      expect(screen.getByRole("button", { name: folder })).toBeDefined();
      expect(screen.getByText(file.name)).toBeDefined();
    });

    test("localizes calendar fallback, weekday and time without shifting floating event times", async () => {
      server.use(
        http.get("*/api/workspace/files/original-file/preview", () =>
          HttpResponse.text(
            "BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261116T153000\nDTEND:20261116T163000\nEND:VEVENT\nEND:VCALENDAR",
          ),
        ),
      );
      render(
        <LanguageProvider initialLocale={locale}>
          <IcsPreview file={file} onError={vi.fn()} />
        </LanguageProvider>,
      );
      expect(await screen.findByText(event)).toBeDefined();
      expect(screen.getByText(weekday)).toBeDefined();
      expect(screen.getByText(time)).toBeDefined();
    });
  },
);

test("keeps English folder actions outside the language provider", () => {
  render(
    <FolderActionsMenu
      folderName="Original Folder"
      onRename={vi.fn()}
      onMove={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Actions for Original Folder" }),
  ).toBeDefined();
});
