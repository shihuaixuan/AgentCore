import { describe, expect, it } from "vitest";
import { collectQwenWorkParts } from "../qwenWorkMessages";

const questions = [{ question: "Which shape?" }, { question: "Which color?" }];
const receipt = {
  questions,
  answers: { "Which color?": "Blue", "Which shape?": "  Circle  " },
};
const ask = {
  type: "tool-AskUserQuestion",
  toolName: "AskUserQuestion",
  toolCallId: "fixture:dialog:ask",
  parentToolUseId: null,
  state: "output-available",
  input: { questions },
  autoSelectedRecommended: false,
  output: receipt,
  result: receipt,
};
const final = { type: "text", id: "done", text: "Drawing ready." };
const prompts = questions.map(({ question }) => question).join("\n");
const promptTurn = { role: "assistant", text: prompts };
const answerTurn = { role: "user", text: "  Circle  \nBlue" };
const finalTurn = { role: "assistant", text: final.text };

function project(parts: object[]) {
  return collectQwenWorkParts(
    JSON.stringify(parts),
    new Set(),
    "assistant",
    { status: "completed", finalTextId: final.id },
    false,
  );
}

describe("QwenWork public clarification turns", () => {
  it("keeps the input order, a human answer turn, and the final; never serializes tool data", () => {
    const extra = {
      ...receipt,
      answers: { ...receipt.answers, unrelated: "Private value" },
      log: "Internal log",
    };
    expect(
      project([
        { type: "text", id: "draft", text: "Private draft" },
        { ...ask, output: extra },
        {
          type: "child-run",
          toolCallId: "other",
          childRun: { id: "other", resultText: "Private result" },
        },
        final,
      ]),
    ).toEqual({
      text: `${prompts}\n${final.text}`,
      omitted: false,
      turns: [promptTurn, answerTurn, finalTurn],
    });
  });

  it("preserves order across calls without inventing a missing final", () => {
    const next = { question: "Which paper?" };
    const reply = { questions: [next], answers: { [next.question]: "Card" } };
    const followUp = {
      ...ask,
      toolCallId: "ask-again",
      input: { questions: [next] },
      output: reply,
      result: undefined,
    };
    expect(project([ask, followUp])).toEqual({
      text: `${prompts}\n${next.question}`,
      omitted: true,
      turns: [
        promptTurn,
        answerTurn,
        { role: "assistant", text: next.question },
        { role: "user", text: "Card" },
      ],
    });
  });

  it.each([
    { parentToolUseId: undefined },
    { parentToolUseId: "" },
    { toolCallId: "fixture::ask" },
    { toolName: "DifferentTool" },
  ])(
    "warns instead of assigning an ambiguous namespaced call: %j",
    (override) => {
      expect(project([{ ...ask, ...override }, final])).toEqual({
        text: final.text,
        omitted: true,
      });
    },
  );

  it("rejects matching parent IDs, duplicate call IDs, and marked nested calls", () => {
    for (const sibling of [
      { type: "tool-example", toolCallId: "fixture:dialog" },
      { type: "child-run", childRun: { id: "fixture" } },
      { type: "tool-example", toolCallId: ask.toolCallId },
    ]) {
      expect(project([ask, final, sibling])).toEqual({
        text: final.text,
        omitted: true,
      });
    }
    for (const override of [
      { parentToolUseId: "child" },
      { metadata: { parent_agent_id: "child" } },
      { metadata: { isSynthetic: true } },
    ]) {
      expect(project([{ ...ask, ...override }, final])).toEqual({
        text: final.text,
        omitted: false,
      });
    }
  });

  it("keeps automatic and pending prompts without treating their output as a person", () => {
    for (const call of [
      { ...ask, autoSelectedRecommended: true },
      {
        ...ask,
        state: "input-available",
        output: undefined,
        result: undefined,
      },
    ]) {
      expect(project([call, final])).toEqual({
        text: `${prompts}\n${final.text}`,
        omitted: false,
      });
    }
  });

  it.each([
    { autoSelectedRecommended: undefined },
    { metadata: { autoSelectedRecommended: true } },
    { output: { ...receipt, metadata: { resolution: "auto-recommended" } } },
    { output: { ...receipt, questions: [...questions].reverse() } },
    {
      result: {
        ...receipt,
        answers: { ...receipt.answers, "Which shape?": "Square" },
      },
    },
    { output: { ...receipt, answers: { "Which shape?": "Circle" } } },
    {
      result: {
        ...receipt,
        answers: {
          ...receipt.answers,
          "Which color?": { text: "Tool output" },
        },
      },
    },
    { output: { ...receipt, isSynthetic: true } },
    { result: null, output: { log: "Not a receipt" } },
  ])(
    "keeps the public prompts but warns on unsupported answer evidence: %#",
    (override) => {
      expect(project([{ ...ask, ...override }, final])).toEqual({
        text: `${prompts}\n${final.text}`,
        omitted: true,
      });
    },
  );

  it("never maps duplicate prompt labels or inherited answer keys to the user", () => {
    for (const labels of [["Repeated", "Repeated"], ["constructor"]]) {
      const questions = labels.map((question) => ({ question }));
      const output = { questions, answers: { Repeated: "Not unique" } };
      expect(
        project([
          { ...ask, input: { questions }, output, result: output },
          final,
        ]),
      ).toEqual({ text: [...labels, final.text].join("\n"), omitted: true });
    }
  });
});
