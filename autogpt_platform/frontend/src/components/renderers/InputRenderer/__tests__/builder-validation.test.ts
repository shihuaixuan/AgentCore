import type { RJSFValidationError } from "@rjsf/utils";
import { expect, it } from "vitest";
import { translateBuilderErrors } from "../utils/builder-validation";

it("changes known AJV messages, not property paths, parameters or custom errors", () => {
  const unknown = { name: "custom", message: "Prompt", stack: "Prompt" };
  const errors: RJSFValidationError[] = [
    {
      name: "required",
      property: ".Prompt",
      params: { missingProperty: "Prompt" },
      stack: "must have required property 'Prompt'",
    },
    {
      name: "minLength",
      property: ".text",
      params: { limit: 4 },
      stack: ".text must NOT have fewer than 4 characters",
    },
    unknown,
  ];
  const original = structuredClone(errors);
  const localized = translateBuilderErrors(errors);
  expect(localized[0]).toMatchObject({
    property: ".Prompt",
    params: { missingProperty: "Prompt" },
    message: "此字段为必填项",
    stack: ".Prompt：此字段为必填项",
  });
  expect(localized[1].message).toBe("至少需要 4 个字符");
  expect(localized[2]).toBe(unknown);
  expect(errors).toEqual(original);
});
