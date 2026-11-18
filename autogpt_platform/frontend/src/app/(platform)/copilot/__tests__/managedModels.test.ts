import { describe, expect, it } from "vitest";
import {
  managedModelRequest,
  selectedChatModel,
} from "../managedModelSelection";

describe("managed chat model selection", () => {
  const models = [
    { id: "first", name: "First model" },
    { id: "second", name: "Second model" },
  ];

  it("uses the selected open model and drops a stale selection", () => {
    expect(selectedChatModel(models, "second")).toBe("second");
    expect(selectedChatModel(models, "closed")).toBe("first");
    expect(selectedChatModel([], "closed")).toBeNull();
  });

  it("does not send a legacy tier for managed chat", () => {
    expect(managedModelRequest({ managedModelID: "second" })).toEqual({
      managed_model_id: "second",
    });
    expect(managedModelRequest({ managedModelID: null })).toEqual({
      managed_model_id: null,
    });
    expect(managedModelRequest("advanced")).toEqual({ model: "advanced" });
  });
});
