import { describe, expect, it } from "vitest";
import { cleanNativeUserText } from "../nativeUserText";

describe("native user text", () => {
  it("extracts a whole query after the known WorkBuddy reminder blocks", () => {
    const input =
      '<system-reminder data-role="user-context">CONTEXT</system-reminder>\r\n' +
      '<system-reminder data-role="additional-data">EXTRA</system-reminder>\r\n' +
      "<user_query>First line\n    indented line </user_query>\n";
    expect(cleanNativeUserText(input)).toBe("First line\n    indented line ");
  });

  it("removes only the leading run of closed system blocks", () => {
    expect(
      cleanNativeUserText(
        "\n<system-reminder>META</system-reminder>\n\n" +
          "<system-prompt>PROMPT</system-prompt>\r\n" +
          "    plain text about <system-reminder>examples</system-reminder>\n",
      ),
    ).toBe(
      "    plain text about <system-reminder>examples</system-reminder>\n",
    );
    expect(cleanNativeUserText("<system-prompt>ONLY</system-prompt>")).toBe("");
    expect(cleanNativeUserText("<user_query>standalone</user_query>")).toBe(
      "standalone",
    );
  });

  it("ignores a closing tag in fenced code when finding the end of a system block", () => {
    const prefix =
      "<system-reminder>Fixture\n```xml\n</system-reminder>\n```\n";
    expect(cleanNativeUserText(prefix)).toBe(prefix);
    expect(cleanNativeUserText(`${prefix}</system-reminder>\nQuestion`)).toBe(
      "Question",
    );
  });

  it.each([
    "  System prompt: literal prose\n",
    "Explain <system-reminder>literal</system-reminder> and <user_query>this</user_query>",
    "`<system-reminder>inline code</system-reminder>`",
    "```xml\n<system-reminder>fenced code</system-reminder>\n```",
    "~~~xml\n<user_query>fenced code</user_query>\n~~~",
    "\n    <system-prompt>indented code</system-prompt>",
    '<system-reminder data-role="unrecognized">literal</system-reminder>',
    "<system-reminder>unclosed literal",
    "<system-reminder>example</system-reminder> is the literal syntax",
    "<user_query>example</user_query> followed by prose",
  ])("preserves %j verbatim", (text) => {
    expect(cleanNativeUserText(text)).toBe(text);
  });
});
