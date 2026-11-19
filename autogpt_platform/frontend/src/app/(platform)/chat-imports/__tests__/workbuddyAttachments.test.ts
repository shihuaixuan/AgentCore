import { describe, expect, it } from "vitest";
import {
  extractAttachmentPaths,
  indexAttachmentDirectory,
  resolveAttachment,
} from "../workbuddyAttachments";

function picked(path: string, text = "fixture") {
  const file = new File([text], path.split("/").at(-1)!);
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

describe("WorkBuddy attachment drafts", () => {
  it("finds path-shaped file links and explicit attachment blocks, not URLs or prose", () => {
    const references = extractAttachmentPaths([
      {
        type: "output_text",
        text: "[report](<file:///D:/Project/out/My%20Report.pdf>) `D:\\Project\\out\\notes.md` https://example.test/file.txt",
      },
      { type: "output_file", path: "out/report.xlsx" },
      {
        type: "input_text",
        text: "D:\\Project\\out\\data.csv\nordinary prose with ./secret.txt in it",
      },
      { type: "other", path: "D:/Project/config.json" },
    ]);
    expect(references).toEqual([
      "D:/Project/out/My Report.pdf",
      "D:/Project/out/notes.md",
      "out/report.xlsx",
      "D:/Project/out/data.csv",
    ]);
  });

  it("matches exact relative components inside the selected root, not by basename", () => {
    const report = picked("Project/out/My Report.pdf");
    const notes = picked("Project/out/notes.md");
    const index = indexAttachmentDirectory([report, notes]);
    const root = "D:\\Project";
    expect(resolveAttachment("d:/project/out/my report.pdf", root, index)).toBe(
      report,
    );
    expect(resolveAttachment("out/notes.md", root, index)).toBe(notes);
    expect(
      resolveAttachment("D:/Other/Project/out/notes.md", root, index),
    ).toBeUndefined();
    expect(
      resolveAttachment("D:/ProjectBackup/out/notes.md", root, index),
    ).toBeUndefined();
    expect(
      resolveAttachment("D:/Project/out/../out/notes.md", root, index),
    ).toBeUndefined();
    expect(resolveAttachment("notes.md", root, index)).toBeUndefined();
    expect(
      resolveAttachment("out/notes.md", "D:/Wrong", index),
    ).toBeUndefined();
  });

  it("does not guess when a Windows case-insensitive path is ambiguous", () => {
    const index = indexAttachmentDirectory([
      picked("Project/Notes.txt"),
      picked("Project/notes.txt"),
    ]);
    expect(resolveAttachment("Notes.txt", "D:/Project", index)).toBeUndefined();
    expect(
      resolveAttachment("Notes.txt", "/home/me/Project", index)?.name,
    ).toBe("Notes.txt");
  });

  it("takes the relative path at the original boundary even when case folding expands the root", () => {
    const report = picked("Projeİt/report.pdf");
    const index = indexAttachmentDirectory([
      report,
      picked("Projeİt/eport.pdf"),
    ]);
    expect(
      resolveAttachment("D:/Projeİt/report.pdf", "D:/Projeİt", index),
    ).toBe(report);
  });
});
