import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { describe, expect, test } from "vitest";
import { describeFolderMoveError } from "../useArtifactsFolders";
import { validateFileName } from "../components/RenameFileDialog/helpers";

describe("artifact validation and move errors", () => {
  test.each([
    { name: "", chinese: "请输入文件名", english: "Enter a file name" },
    {
      name: "a".repeat(256),
      chinese: "文件名过长",
      english: "That name is too long",
    },
    {
      name: "..",
      chinese: "文件名无效",
      english: "That is not a valid file name",
    },
    {
      name: "bad/name",
      chinese: "文件名不能包含斜杠",
      english: "File names cannot contain slashes",
    },
  ])(
    "localizes invalid names while keeping English as the default",
    ({ name, chinese, english }) => {
      expect(validateFileName(name, "zh-CN")).toBe(chinese);
      expect(validateFileName(name)).toBe(english);
    },
  );

  test("does not reject or translate a valid mixed-language file name", () => {
    expect(validateFileName("Original 自定义.txt", "zh-CN")).toBeNull();
  });

  test("preserves folder names in conflict errors and defaults to English", () => {
    const conflict = new ApiError("Raw server error", 409, {});
    expect(describeFolderMoveError(conflict, "Original Folder", "zh-CN")).toBe(
      "目标位置已存在名为“Original Folder”的文件夹",
    );
    expect(describeFolderMoveError(conflict, "Original Folder")).toBe(
      "A folder named “Original Folder” is already there",
    );
    expect(
      describeFolderMoveError(
        new ApiError("Raw", 400, {}),
        "Original",
        "zh-CN",
      ),
    ).toBe("不能将文件夹移入自身");
    expect(describeFolderMoveError(null, "Original", "zh-CN")).toBe(
      "无法移动文件夹",
    );
  });
});
