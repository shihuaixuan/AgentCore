import type { RJSFSchema } from "@rjsf/utils";
import { describe, expect, it, vi } from "vitest";
import { getBuilderDisplaySchema } from "../uiSchema";
import type { Locale } from "@/lib/i18n/locale";

const words = new Map([
  ["Prompt", "提示词"],
  ["Field help", "字段说明"],
  ["Select an operation", "选择运算方式"],
  ["Enter pagination token", "输入分页令牌"],
  ["For example: 10", "例如：10"],
  ["main", "不应改写分支名"],
  ["{{ Prompt }}", "不能翻译代码"],
]);

function schemaText(text: string, locale: Locale) {
  return (locale === "zh-CN" && words.get(text)) || text;
}

const untouched = { type: "string", title: "Unknown title" } as const;
const schema = {
  type: "object",
  required: ["reasoning_effort"],
  properties: {
    reasoning_effort: {
      title: "Author's title",
      description: "Field help",
      type: "array",
      items: {
        anyOf: [
          {
            type: "string",
            title: "Prompt",
            enum: ["provider-code", "low", "high", "medium"],
            enumNames: ["Prompt", "Bespoke name"],
            default: "Prompt",
            placeholder: "{{ Prompt }}",
            examples: ["Prompt"],
          },
          { $ref: "#/$defs/Prompt" },
        ],
      },
    },
    untouched,
  },
  $defs: {
    Prompt: { oneOf: [{ type: "integer", title: "Prompt" }, untouched] },
  },
  default: { title: "Prompt", description: "Field help" },
  llm_model_metadata: { Prompt: { title: "Prompt" } },
} as RJSFSchema;

describe("builder schema display annotations", () => {
  it("translates declared annotations and option labels, never graph data", () => {
    const original = structuredClone(schema);
    const display = getBuilderDisplaySchema(schema, "zh-CN", schemaText);
    const field = display.properties?.reasoning_effort as RJSFSchema;
    const option = (field.items as RJSFSchema).anyOf?.[0] as RJSFSchema;
    expect(field.title).toBe("Author's title");
    expect(field.description).toBe("字段说明");
    expect(option).toMatchObject({
      title: "提示词",
      enum: ["provider-code", "low", "high", "medium"],
      enumNames: ["提示词", "Bespoke name", "高", "中"],
      default: "Prompt",
      placeholder: "{{ Prompt }}",
      examples: ["Prompt"],
    });
    expect((field.items as RJSFSchema).anyOf?.[1]).toEqual({
      $ref: "#/$defs/Prompt",
    });
    expect((display.$defs?.Prompt as RJSFSchema).oneOf?.[0]).toEqual({
      type: "integer",
      title: "提示词",
    });
    expect(display.properties?.untouched).toBe(untouched);
    expect(display.required).toBe(schema.required);
    expect(display.default).toBe(schema.default);
    expect(display.llm_model_metadata).toBe(schema.llm_model_metadata);
    expect(schema).toEqual(original);
  });

  it("does not use the field lexicon for raw enum data or nonmatching copy", () => {
    const raw: RJSFSchema = {
      title: "Prompt!",
      enum: ["Prompt", "gpt-5", "{{ Prompt }}", "constructor"],
    };
    expect(getBuilderDisplaySchema(raw, "zh-CN", schemaText)).toBe(raw);
  });

  it("uses the declared key only as a missing title's display fallback", () => {
    const raw: RJSFSchema = { properties: { Prompt: { type: "string" } } };
    expect(getBuilderDisplaySchema(raw, "zh-CN", schemaText)).toEqual({
      properties: { Prompt: { title: "提示词", type: "string" } },
    });
    expect(raw.properties?.Prompt).toEqual({ type: "string" });
  });

  it("localizes an allowlisted UI hint without changing example code", () => {
    expect(
      getBuilderDisplaySchema(
        { placeholder: "Select an operation" },
        "zh-CN",
        schemaText,
      ).placeholder,
    ).toBe("选择运算方式");
    expect(
      getBuilderDisplaySchema(
        { placeholder: "Enter pagination token" },
        "zh-CN",
        schemaText,
      ).placeholder,
    ).toBe("输入分页令牌");
    expect(
      getBuilderDisplaySchema(
        { placeholder: "For example: 10" },
        "zh-CN",
        schemaText,
      ).placeholder,
    ).toBe("例如：10");
    expect(
      getBuilderDisplaySchema({ placeholder: "main" }, "zh-CN", schemaText)
        .placeholder,
    ).toBe("main");
    const raw = { placeholder: "{{ Prompt }}" };
    expect(getBuilderDisplaySchema(raw, "zh-CN", schemaText)).toBe(raw);
  });

  it.each([
    [
      "operator",
      ["equals", "not_contains", ">="],
      ["等于", "不包含", "大于等于"],
    ],
    ["sort_order", ["ascending", "descending"], ["升序", "降序"]],
    ["frequency", ["DAILY", "WEEKLY", "MONTHLY"], ["每日", "每周", "每月"]],
    ["format", ["date", "text", "json"], ["日期", "文本", "JSON"]],
    [
      "status",
      ["pending", "completed", "cancelled"],
      ["待处理", "已完成", "已取消"],
    ],
    ["operation", ["Add", "Divide"], ["加法", "除法"]],
  ] as const)(
    "translates only display labels for %s",
    (key, values, labels) => {
      const property = { type: "string" as const, enum: [...values] };
      const raw = { properties: { [key]: property } };
      const display = getBuilderDisplaySchema(raw, "zh-CN", schemaText);
      expect(display.properties?.[key]).toEqual({
        ...property,
        enumNames: labels,
      });
      expect((display.properties?.[key] as RJSFSchema).enum).toBe(
        property.enum,
      );
    },
  );

  it("keeps HTTP methods, model/tool IDs and business options even if they collide with display words", () => {
    const values = ["GET", "POST", "high", "date", "Add", "Prompt"];
    const externalChoices = {
      type: "string" as const,
      enum: values,
      enumNames: values,
    };
    const raw = {
      properties: Object.fromEntries(
        ["http_method", "model", "selected_tool", "order_status"].map((key) => [
          key,
          externalChoices,
        ]),
      ),
    };
    expect(getBuilderDisplaySchema(raw, "zh-CN", schemaText)).toBe(raw);
  });

  it("uses authored const option labels before a scoped enum label and never rewrites the discriminator", () => {
    const choices = [
      { const: "DAILY" },
      { const: "WEEKLY", title: "Every Friday" },
    ];
    const raw = {
      properties: {
        frequency: { oneOf: choices },
        model: { oneOf: [{ const: "Prompt", title: "Prompt" }] },
      },
    };
    const display = getBuilderDisplaySchema(raw, "zh-CN", schemaText);
    expect((display.properties?.frequency as RJSFSchema).oneOf).toEqual([
      { const: "DAILY", title: "每日" },
      choices[1],
    ]);
    expect(display.properties?.model).toBe(raw.properties.model);
  });

  it("bypasses the glossary for English and for schemas without a trusted source", () => {
    const lookup = vi.fn(schemaText);
    expect(getBuilderDisplaySchema(schema, "en", lookup)).toBe(schema);
    expect(getBuilderDisplaySchema(schema, "zh-CN")).toBe(schema);
    expect(lookup).not.toHaveBeenCalled();
  });
});
