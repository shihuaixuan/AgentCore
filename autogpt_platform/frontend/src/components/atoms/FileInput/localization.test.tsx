import { expect, test, vi } from "vitest";
import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { FileInput } from "./FileInput";
import { getFileLabel } from "./helpers";

test.each([
  ["original.png", "image/png", "PNG 文件"],
  ["original.txt", undefined, "TXT 文件"],
  ["original", undefined, "文件"],
])(
  "localizes the file type label for %s without changing MIME identifiers",
  (filename, contentType, expected) => {
    expect(getFileLabel(filename, contentType, "zh-CN")).toBe(expected);
  },
);

test("localizes the uploaded-file fallback without modifying the workspace URI", () => {
  const onChange = vi.fn();
  render(
    <LanguageProvider>
      <FileInput
        mode="base64"
        value="workspace://Original-file"
        onChange={onChange}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("已上传的文件")).toBeDefined();
  expect(onChange).not.toHaveBeenCalled();
});

test.each([
  ["workspace://Original-file#application/pdf", "PDF 文件"],
  ["data:text/plain;base64,T3JpZ2luYWw=", "PLAIN 文件"],
  ["Original.txt", "TXT 文件"],
] as const)(
  "localizes the file type for %s without emitting a change",
  (value, expected) => {
    const onChange = vi.fn();
    render(
      <LanguageProvider>
        <FileInput mode="base64" value={value} onChange={onChange} />
      </LanguageProvider>,
    );
    expect(screen.getByText(expected)).toBeDefined();
    expect(onChange).not.toHaveBeenCalled();
  },
);

test("keeps English file type labels by default", () => {
  expect(getFileLabel("Original.txt")).toBe("TXT file");
});
