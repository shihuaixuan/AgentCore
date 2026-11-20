import { describe, expect, it, vi } from "vitest";
import {
  findWorkBuddyTranscripts,
  readWorkBuddyTranscriptFile,
} from "../workbuddyDirectory";
import { readWorkBuddyFiles } from "../workbuddyTranscript";
import { ImportValidationError } from "../validation";

const FILE_LIMIT = 32 * 1024 * 1024;

function pickedFile(path: string, text = "") {
  const file = new File([text], path.split("/").at(-1)!);
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

function transcript(index: number) {
  return JSON.stringify({
    type: "message",
    sessionId: `session-${index}`,
    id: "question",
    role: "user",
    content: [{ type: "input_text", text: `Question ${index}` }],
  });
}

describe("WorkBuddy directory reads", () => {
  it("finds and reads more than 25 nested transcripts without the manual selection cap", async () => {
    const files = Array.from({ length: 29 }, (_, index) =>
      pickedFile(
        `projects/project/subfolder/${index}.JSONL`,
        transcript(index),
      ),
    );
    const candidates = findWorkBuddyTranscripts([
      pickedFile("projects/bundle.json"),
      pickedFile("projects/backup.jsonl.bak"),
      ...files,
      pickedFile("projects/project/agents.db"),
    ]);
    expect(candidates).toEqual(files);
    const ids = new Set<string>();
    for (const [index, file] of candidates.entries()) {
      const conversation = await readWorkBuddyTranscriptFile(file);
      expect(conversation.messages).toEqual([
        { role: "user", text: `Question ${index}` },
      ]);
      ids.add(conversation.source_id);
    }
    expect(ids.size).toBe(29);
    await expect(readWorkBuddyFiles(files)).rejects.toThrow("files");
  });

  it("counts oversized and unreadable native names as candidates without opening them", async () => {
    const large = pickedFile("projects/large.jsonl");
    Object.defineProperty(large, "size", { value: FILE_LIMIT + 1 });
    const largeRead = vi.spyOn(large, "text");
    const unreadable = pickedFile("projects/test/unreadable.jsonl");
    const unreadableRead = vi
      .spyOn(unreadable, "text")
      .mockRejectedValue(
        new DOMException("Synthetic read failure", "NotReadableError"),
      );

    expect(findWorkBuddyTranscripts([large, unreadable])).toEqual([
      large,
      unreadable,
    ]);
    expect(unreadableRead).not.toHaveBeenCalled();
    await expect(readWorkBuddyTranscriptFile(large)).rejects.toEqual(
      new ImportValidationError("file-size"),
    );
    expect(largeRead).not.toHaveBeenCalled();
    await expect(readWorkBuddyTranscriptFile(unreadable)).rejects.toMatchObject(
      {
        name: "NotReadableError",
      },
    );
  });

  it("caps bulk reads per file and keeps the manual aggregate limit and bundle support", async () => {
    const first = pickedFile("projects/first.jsonl", transcript(1));
    const second = pickedFile("projects/second.jsonl", transcript(2));
    Object.defineProperty(first, "size", { value: FILE_LIMIT });
    Object.defineProperty(second, "size", { value: FILE_LIMIT });
    const conversation = await readWorkBuddyTranscriptFile(first);
    expect((await readWorkBuddyTranscriptFile(second)).title).toBe(
      "Question 2",
    );
    await expect(readWorkBuddyFiles([first, second])).rejects.toThrow(
      "file-size",
    );

    const bundle = pickedFile(
      "projects/export.json",
      JSON.stringify({ version: 1, conversations: [conversation] }),
    );
    await expect(readWorkBuddyFiles([bundle])).resolves.toEqual([
      { conversation, references: [] },
    ]);
    await expect(readWorkBuddyTranscriptFile(bundle)).rejects.toThrow(
      "file-type",
    );
  });
});
