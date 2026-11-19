export type TurnRecipient =
  | { type: "otto" }
  | { type: "expert"; expert_id: string };

export interface TurnSendOptions {
  body?: { recipient: TurnRecipient };
}

export class RecipientSendRefusedError extends Error {}

export function isRecipientSendRefusal(status: number) {
  return (
    status === 400 ||
    status === 403 ||
    status === 404 ||
    status === 409 ||
    status === 422
  );
}

export function parseTurnRecipient(value: unknown): TurnRecipient | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) return;
  if (value.type === "otto") return { type: "otto" };
  if (
    value.type === "expert" &&
    "expert_id" in value &&
    typeof value.expert_id === "string"
  ) {
    return { type: "expert", expert_id: value.expert_id };
  }
}
