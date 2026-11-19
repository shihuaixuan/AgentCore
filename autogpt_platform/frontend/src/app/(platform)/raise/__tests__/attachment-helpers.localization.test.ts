import { expect, test } from "vitest";
import { failedAttachmentMessage } from "../components/KitStep/helpers";

test("localizes attachment failure reasons while preserving names, identifiers and English defaults", () => {
  const failures = [
    { kind: "skill", source: "library", id: "original", reason: "unavailable" },
  ];
  const drafts = [
    {
      kind: "skill" as const,
      source: "library" as const,
      id: "original",
      name: "Original Skill",
    },
  ];
  expect(failedAttachmentMessage(failures, drafts, "zh-CN")).toBe(
    "Original Skill 已不可用",
  );
  expect(failedAttachmentMessage(failures, drafts)).toBe(
    "Original Skill is no longer available",
  );
  expect(
    failedAttachmentMessage(
      [{ ...failures[0], id: "raw-id", reason: "install_failed" }],
      [],
      "zh-CN",
    ),
  ).toBe("raw-id 无法安装");
});
