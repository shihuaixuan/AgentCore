import { nested, record, type Fields } from "./qwenWorkAttribution";

type Clarification = { prompt?: string; reply?: string; omitted: boolean };

function toolCallCounts(parts: Fields[]) {
  const counts = new Map<string, number>();
  for (const part of parts) {
    const childID = part.type === "child-run" && record(part.childRun)?.id;
    for (const id of new Set([part.toolCallId, childID])) {
      if (typeof id === "string") counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

function hasUniqueRootID(part: Fields, counts: Map<string, number>) {
  const id = part.toolCallId;
  if (
    typeof id !== "string" ||
    !id.trim() ||
    counts.get(id) !== 1 ||
    part.parentToolUseId != null ||
    (part.toolName != null && part.toolName !== "AskUserQuestion")
  )
    return false;
  if (!id.includes(":")) return true;
  if (
    id.length > 1024 ||
    /\s/.test(id) ||
    part.parentToolUseId !== null ||
    part.toolName !== "AskUserQuestion" ||
    id.split(":").includes("")
  )
    return false;
  for (
    let split = id.indexOf(":");
    split !== -1;
    split = id.indexOf(":", split + 1)
  ) {
    if (counts.has(id.slice(0, split))) return false;
  }
  return true;
}

function conflictsWithManualAnswer(fields: Fields) {
  return [fields, record(fields.metadata)].some(
    (source) =>
      source &&
      (nested(source) ||
        source.resolution != null ||
        (source.autoSelectedRecommended !== undefined &&
          source.autoSelectedRecommended !== false)),
  );
}

function answersFromReceipt(raw: unknown, prompts: string[]) {
  const receipt = record(raw);
  const echoed = receipt?.questions;
  const answers = record(receipt?.answers);
  if (
    !receipt ||
    conflictsWithManualAnswer(receipt) ||
    !answers ||
    !Array.isArray(echoed) ||
    echoed.length !== prompts.length
  )
    return;
  const values: string[] = [];
  for (const [index, prompt] of prompts.entries()) {
    if (
      record(echoed[index])?.question !== prompt ||
      !Object.hasOwn(answers, prompt)
    )
      return;
    const value = answers[prompt];
    if (typeof value !== "string" || !value.trim()) return;
    values.push(value);
  }
  return values;
}

function confirmedReply(receipts: unknown[], prompts: string[]) {
  if (new Set(prompts).size !== prompts.length) return;
  let confirmed: string[] | undefined;
  for (const receipt of receipts) {
    const values = answersFromReceipt(receipt, prompts);
    if (
      !values ||
      (confirmed && confirmed.some((value, index) => value !== values[index]))
    )
      return;
    confirmed = values;
  }
  return confirmed?.join("\n");
}

export function qwenWorkClarificationReader(parts: Fields[]) {
  let counts: Map<string, number> | undefined;
  return function read(part: Fields): Clarification {
    if (part.state === "input-streaming" || part.state === "output-error")
      return { omitted: false };
    counts ??= toolCallCounts(parts);
    if (
      !hasUniqueRootID(part, counts) ||
      !["call", "input-available", "output-available"].includes(
        String(part.state),
      )
    )
      return { omitted: true };

    const questions = record(part.input)?.questions;
    if (!Array.isArray(questions) || !questions.length)
      return { omitted: true };
    const prompts = questions.flatMap((item) => {
      const question = record(item)?.question;
      return typeof question === "string" && question.trim() ? [question] : [];
    });
    const prompt = prompts.join("\n");
    if (prompts.length !== questions.length) return { prompt, omitted: true };
    if (
      part.state !== "output-available" ||
      part.autoSelectedRecommended === true
    )
      return { prompt, omitted: false };

    const receipts = [part.output, part.result].filter(
      (raw) => raw !== undefined,
    );
    if (
      part.autoSelectedRecommended === undefined &&
      !String(part.toolCallId).includes(":") &&
      !receipts.some(
        (raw) => record(raw)?.answers != null || record(raw)?.questions != null,
      )
    )
      return { prompt, omitted: false };
    const reply =
      part.autoSelectedRecommended === false && !conflictsWithManualAnswer(part)
        ? confirmedReply(receipts, prompts)
        : undefined;
    return { prompt, reply, omitted: reply === undefined };
  };
}
