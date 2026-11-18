import type { CopilotLlmModel } from "./store";
import { create } from "zustand";

export type ChatModelChoice =
  | CopilotLlmModel
  | { managedModelID: string | null };

export const useManagedModelSelection = create<{
  modelID: string | null;
  selectModel: (modelID: string) => void;
}>((set) => ({
  modelID: null,
  selectModel: (modelID) => set({ modelID }),
}));

export function selectedChatModel(
  models: readonly { id: string }[],
  modelID: string | null,
): string | null {
  return (
    models.find((model) => model.id === modelID)?.id ?? models[0]?.id ?? null
  );
}

export function managedModelRequest(choice: ChatModelChoice | undefined) {
  return typeof choice === "object"
    ? { managed_model_id: choice.managedModelID }
    : { model: choice ?? null };
}
