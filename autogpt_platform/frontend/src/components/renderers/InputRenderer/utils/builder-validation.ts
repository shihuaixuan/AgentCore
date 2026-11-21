import type { RJSFValidationError } from "@rjsf/utils";

const requiredMessage = "此字段为必填项";
const knownMessages = new Map([
  ["This field is required", requiredMessage],
  ["is a required property", requiredMessage],
  ["must be equal to one of the allowed values", "请选择允许的值"],
]);

export function builderFieldError(message: string) {
  return knownMessages.get(message) ?? message;
}

function validationMessage({ name, params }: RJSFValidationError) {
  if (name === "required") return requiredMessage;
  if (name === "enum") return "请选择允许的值";
  const limit: unknown = params?.limit;
  if (typeof limit !== "number") return;
  switch (name) {
    case "minLength":
      return `至少需要 ${limit} 个字符`;
    case "maxLength":
      return `最多允许 ${limit} 个字符`;
    case "minItems":
      return `至少需要 ${limit} 项`;
    case "maxItems":
      return `最多允许 ${limit} 项`;
    case "minimum":
      return `不能小于 ${limit}`;
    case "maximum":
      return `不能大于 ${limit}`;
    case "exclusiveMinimum":
      return `必须大于 ${limit}`;
    case "exclusiveMaximum":
      return `必须小于 ${limit}`;
  }
}

export function translateBuilderErrors(errors: RJSFValidationError[]) {
  return errors.map((error) => {
    const message = validationMessage(error);
    if (!message) return error;
    const field = error.title || error.property;
    return {
      ...error,
      message,
      stack: field ? `${field}：${message}` : message,
    };
  });
}
