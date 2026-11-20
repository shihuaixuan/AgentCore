import { describe, expect, it } from "vitest";
import { collectQwenWorkParts } from "../qwenWorkMessages";

const final = { status: "completed", finalTextId: "chosen" };
const answer = { type: "text", id: "chosen", text: "Public reply" };
const note = { type: "text", id: "note", text: "Preparatory note" };
const file = { type: "data-file", data: { filePath: "D:/Fixture/file.pdf" } };

function project(parts: object[], metadata: object = final) {
  const refs = new Set<string>();
  const projection = collectQwenWorkParts(
    JSON.stringify(parts),
    refs,
    "assistant",
    { ...metadata },
    false,
  );
  return { ...projection, refs: [...refs] };
}

describe("QwenWork assistant parts", () => {
  it("keeps only the final ID, not the first/last text or a file of ambiguous ownership", () => {
    expect(project([note, answer, file, note])).toEqual({
      text: answer.text,
      refs: [],
      omitted: true,
    });
    expect(project([answer, file])).toEqual({
      text: answer.text,
      refs: [file.data.filePath],
      omitted: false,
    });
  });

  it("does not treat a contradictory or fallback selector as an explicit final", () => {
    for (const metadata of [
      { ...final, finalTextSource: "unknown-format" },
      { ...final, finalTextSource: "client-last-text" },
      { status: "completed", finalTextSource: "explicit" },
    ]) {
      expect(project([note, answer], metadata)).toMatchObject({
        text: "",
        omitted: true,
      });
    }
    expect(
      project([answer], { ...final, finalTextSource: "client-last-text" }).text,
    ).toBe(answer.text);
  });

  it("does not publish draft, plan or delegated text even if a final ID points to it", () => {
    for (const block of [
      { ...answer, state: "streaming" },
      { ...answer, id: "runtime-plan:scratch" },
      { ...answer, id: "delegated:step" },
      { ...answer, metadata: { isSidechain: true } },
      { ...answer, parentToolUseId: "delegated" },
    ]) {
      expect(project([block], { ...final, finalTextId: block.id }).text).toBe(
        "",
      );
    }
  });

  it("keeps an independently presented clarification while a turn is still streaming", () => {
    const question = {
      type: "tool-AskUserQuestion",
      toolCallId: "ask",
      state: "input-available",
      input: { questions: [{ question: "Metric or imperial?" }] },
    };
    expect(project([note, question], { status: "streaming" })).toEqual({
      text: "Metric or imperial?",
      omitted: false,
      refs: [],
    });
    expect(
      project([{ ...question, input: { text: "Not the question schema" } }]),
    ).toMatchObject({
      text: "",
      omitted: true,
    });
  });
});

function user(parts: object[]) {
  const refs = new Set<string>();
  const projection = collectQwenWorkParts(
    JSON.stringify(parts),
    refs,
    "user",
    {},
    false,
  );
  return { ...projection, refs: [...refs] };
}

describe("QwenWork user parts", () => {
  function block(text: string) {
    return { type: "text", text };
  }

  it("takes the marked question alone, never an adjacent instruction or file", () => {
    const query = "  Which tile?\n";
    expect(
      user([
        block("Prefix"),
        block(
          `<system-prompt>Expert setup</system-prompt>\n<user_query>${query}</user_query>`,
        ),
        file,
        block("Suffix"),
      ]),
    ).toMatchObject({ text: query, omitted: true, refs: [] });
    expect(
      user([
        block("<system-reminder>Context</system-reminder>"),
        block("Unmarked instruction"),
      ]),
    ).toMatchObject({ text: "", omitted: true });
    expect(
      user([
        block("<user_query>A</user_query>"),
        block("<user_query>B</user_query>"),
      ]),
    ).toMatchObject({ text: "", omitted: true });
    const wrapped =
      "<system-reminder>Setup</system-reminder>\n<user_query>Which tile?</user_query>";
    expect(
      user([
        block(wrapped),
        { ...block("Unrelated editor part"), editorBody: "start" },
      ]),
    ).toMatchObject({ text: "Which tile?", omitted: true });
    expect(
      user([
        { ...block(wrapped), editorBody: "start", literal: true },
        block("Adjacent note"),
      ]),
    ).toMatchObject({ text: "Which tile?", omitted: true });
  });

  it("excludes expert content across blocks and does not mistake its embedded query for the user", () => {
    const prefix = block("<qw-agent-content>");
    const suffix = block("</qw-agent-content>");
    const context = [
      prefix,
      block("<user_query>Expert input</user_query>"),
      file,
      suffix,
    ];
    expect(
      user([...context, block("<user_query>Choose a tile</user_query>")]),
    ).toMatchObject({ text: "Choose a tile", refs: [] });
    expect(
      user([...context, block("Not explicitly attributed")]),
    ).toMatchObject({ text: "", omitted: true, refs: [] });
    expect(
      user([prefix, block("<user_query>Never closed</user_query>")]),
    ).toMatchObject({ text: "", omitted: true });
    const combined =
      "<system-prompt>Setup</system-prompt>\n<qw-agent-content>Hidden</qw-agent-content>\n<user_query>Real question</user_query>";
    expect(user([block(combined), block("Trailing note")])).toMatchObject({
      text: "Real question",
      omitted: true,
    });
    expect(
      user([
        block("Unmarked text\n<qw-agent-content>Context</qw-agent-content>"),
      ]),
    ).toMatchObject({ text: "", omitted: true });
  });

  it("keeps the native editor body verbatim, including literal syntax and link labels", () => {
    const start = {
      ...block("<user_query>Literal syntax</user_query>\n  "),
      literal: true,
      editorBody: "start",
    };
    const link = {
      type: "link",
      text: "example",
      href: "https://example.test",
      editorBody: "continue",
    };
    expect(
      user([block("Adjacent preface"), start, link, block("Adjacent suffix")]),
    ).toMatchObject({ text: start.text + link.text, omitted: true });
    expect(
      user([
        {
          ...block("<system-reminder>literal example</system-reminder>"),
          literal: true,
        },
      ]),
    ).toMatchObject({
      text: "<system-reminder>literal example</system-reminder>",
      omitted: false,
    });
    expect(
      user([block("Explain `<qw-agent-content>` in this code.")]),
    ).toMatchObject({
      text: "Explain `<qw-agent-content>` in this code.",
      omitted: false,
    });
    expect(
      user([
        { ...block("Left"), literal: true },
        { ...block("  "), literal: true },
        { ...block("right"), literal: true },
      ]),
    ).toMatchObject({ text: "Left  right", omitted: false });
  });
});
