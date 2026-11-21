import type { RJSFSchema } from "@rjsf/utils";
import type { Locale } from "@/lib/i18n/locale";
import { getBuilderEnumLabels } from "./schemaTypeLabel";

export const uiSchema = {
  credentials: {
    "ui:field": "custom/credential_field",
    provider: { "ui:widget": "hidden" },
    type: { "ui:widget": "hidden" },
    id: { "ui:autofocus": true },
    title: { "ui:placeholder": "Optional title" },
  },
  properties: {
    "ui:field": "CustomObjectField",
  },
};

const chineseUiSchema = {
  ...uiSchema,
  credentials: {
    ...uiSchema.credentials,
    title: { "ui:placeholder": "可选标题" },
  },
};

export function getBuilderUiSchema(locale: Locale) {
  return locale === "zh-CN" ? chineseUiSchema : uiSchema;
}

export type BuilderSchemaText = (text: string, locale: Locale) => string;

const promptPlaceholder =
  /^(?:(?:enter|choose|select|pick|paste|specify|leave|provide|describe)\s|for example[:,]|e\.g\.[,\s])/i;

function isSchema(value: unknown): value is RJSFSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getBuilderDisplaySchema(
  schema: RJSFSchema,
  locale: Locale,
  schemaText?: BuilderSchemaText,
): RJSFSchema {
  if (locale !== "zh-CN" || !schemaText || !isSchema(schema)) return schema;
  const translate = schemaText;

  function visit(
    node: RJSFSchema,
    fieldKey?: string,
    enumField = fieldKey,
    isOption = false,
  ): RJSFSchema {
    let display = node;
    function set(key: string, value: unknown) {
      if (node[key] === value) return;
      if (display === node) display = { ...node };
      display[key] = value;
    }

    const vocabulary = getBuilderEnumLabels(enumField);
    function optionLabel(value: unknown, name?: unknown) {
      const raw = String(value);
      const label = typeof name === "string" ? name : raw;
      if (!vocabulary) return label;
      if (label !== raw) return translate(label, locale);
      return typeof value === "string" && Object.hasOwn(vocabulary, value)
        ? vocabulary[value]
        : label;
    }

    const title = node.title || fieldKey;
    if (isOption && Object.hasOwn(node, "const")) {
      const label = optionLabel(node.const, node.title);
      if (label !== (node.title ?? String(node.const))) set("title", label);
    } else if (typeof title === "string") {
      const label = translate(title, locale);
      if (label !== title) set("title", label);
    }
    if (typeof node.description === "string") {
      set("description", translate(node.description, locale));
    }
    if (
      typeof node.placeholder === "string" &&
      promptPlaceholder.test(node.placeholder)
    ) {
      set("placeholder", translate(node.placeholder, locale));
    }

    if (vocabulary && Array.isArray(node.enum)) {
      let changed = false;
      const names = node.enum.map((value, index) => {
        const name = node.enumNames?.[index];
        const raw = typeof name === "string" ? name : String(value);
        const translated = optionLabel(value, name);
        changed ||= translated !== raw;
        return translated;
      });
      if (changed) set("enumNames", names);
    }

    for (const key of [
      "properties",
      "$defs",
      "definitions",
      "patternProperties",
    ]) {
      const definitions = node[key];
      if (!isSchema(definitions)) continue;
      let mapped = definitions;
      for (const [name, child] of Object.entries(definitions)) {
        if (!isSchema(child)) continue;
        const next = visit(
          child,
          key === "properties" ? name : undefined,
          key === "patternProperties" ? undefined : name,
        );
        if (next !== child) {
          if (mapped === definitions) mapped = { ...definitions };
          mapped[name] = next;
        }
      }
      set(key, mapped);
    }
    for (const key of [
      "items",
      "oneOf",
      "anyOf",
      "allOf",
      "additionalProperties",
      "additionalItems",
      "if",
      "then",
      "else",
    ]) {
      const child = node[key];
      const isAlternative = key === "oneOf" || key === "anyOf";
      const childEnum =
        key === "items" || isAlternative || key === "allOf"
          ? enumField
          : undefined;
      if (isSchema(child)) set(key, visit(child, undefined, childEnum));
      else if (Array.isArray(child)) {
        const children = child.map((item) =>
          isSchema(item)
            ? visit(item, undefined, childEnum, isAlternative)
            : item,
        );
        if (children.some((item, index) => item !== child[index]))
          set(key, children);
      }
    }
    return display;
  }
  return visit(schema);
}
