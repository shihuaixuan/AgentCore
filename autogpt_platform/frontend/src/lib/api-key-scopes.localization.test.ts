import { expect, it } from "vitest";
import { getScopeDescription, SCOPE_DESCRIPTIONS } from "./api-key-scopes";

it("covers every API permission without translating the permission identifiers", () => {
  for (const permission of Object.keys(SCOPE_DESCRIPTIONS) as Array<
    keyof typeof SCOPE_DESCRIPTIONS
  >) {
    expect(getScopeDescription(permission, "zh-CN")).toMatch(/[\u3400-\u9fff]/);
    expect(getScopeDescription(permission)).toBe(
      SCOPE_DESCRIPTIONS[permission],
    );
  }
});
