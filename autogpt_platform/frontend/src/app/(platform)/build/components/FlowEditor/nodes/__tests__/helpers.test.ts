import type { RJSFSchema } from "@rjsf/utils";
import { describe, expect, it } from "vitest";
import { getEdgeColorFromOutputType, getTypeDisplayInfo } from "../helpers";

describe("getTypeDisplayInfo", () => {
  it("names each data type and gives it its colour role", () => {
    expect(getTypeDisplayInfo({ type: "boolean" })).toEqual({
      displayType: "true/false",
      colorClass: "!text-yellow",
    });
    expect(getTypeDisplayInfo({ type: "array" })).toEqual({
      displayType: "list",
      colorClass: "!text-indigo",
    });
    expect(getTypeDisplayInfo({ type: "array", format: "table" })).toEqual({
      displayType: "table",
      colorClass: "!text-indigo",
    });
    expect(getTypeDisplayInfo({ type: "string", format: "date" })).toEqual({
      displayType: "date",
      colorClass: "!text-info",
    });
  });

  it("falls back to the tertiary role for an unknown type", () => {
    expect(getTypeDisplayInfo({ type: "mystery" }).colorClass).toBe(
      "!text-foreground-tertiary",
    );
  });

  it.each([
    [{ type: "string" }, "文本"],
    [{ type: "number" }, "数字"],
    [{ type: "integer" }, "整数"],
    [{ type: "boolean" }, "布尔值"],
    [{ type: "array" }, "列表"],
    [{ type: "object" }, "对象"],
    [{ type: "null" }, "空值"],
    [{}, "任意类型"],
    [{ type: "array", format: "table" }, "表格"],
    [{ type: "string", format: "date" }, "日期"],
    [{ type: "string", format: "time" }, "时间"],
    [{ type: "string", format: "date-time" }, "日期时间"],
    [{ type: "string", format: "file" }, "文件"],
    [{ type: "string", format: "short-text" }, "文本"],
    [{ type: "string", format: "long-text" }, "文本"],
    [{ type: "mystery" }, "mystery"],
    [{ type: "date" }, "date"],
    [{ type: "list" }, "list"],
  ])(
    "localizes type labels without changing schemas or colour roles",
    (schema, label) => {
      const original = structuredClone(schema);
      const english = getTypeDisplayInfo(schema);
      expect(getTypeDisplayInfo(schema, "zh-CN")).toEqual({
        ...english,
        displayType: label,
      });
      expect(schema).toEqual(original);
    },
  );
});

describe("getEdgeColorFromOutputType", () => {
  const schema: RJSFSchema = {
    properties: {
      flag: { type: "boolean" },
      result: { type: "object", properties: { rows: { type: "array" } } },
    },
  };

  it("strokes an edge in its output's type colour", () => {
    expect(getEdgeColorFromOutputType(schema, "flag")).toEqual({
      colorClass: "stroke-yellow",
    });
    expect(getEdgeColorFromOutputType(schema, "result_#_rows")).toEqual({
      colorClass: "stroke-indigo",
    });
  });

  it("uses the plain edge colour when the output is unknown", () => {
    expect(getEdgeColorFromOutputType(schema, "nope")).toEqual({
      colorClass: "stroke-edge/50",
    });
    expect(getEdgeColorFromOutputType(undefined, "flag")).toEqual({
      colorClass: "stroke-edge/50",
    });
  });
});
