import { describe, expect, it } from "vitest";
import {
  getBuilderBlockText,
  getBuilderCategoryLabel,
  getBuilderSchemaText,
  hasBuilderBlockCopy,
} from "../blockCopy";

const calculator = Object.freeze({
  id: "b1ab9b19-67a6-406d-abf5-2dba76d00c79",
  name: "CalculatorBlock",
  description: "Performs a mathematical operation on two numbers.",
});

describe("builder catalog display copy", () => {
  it("translates the built-in name and its description without altering the API data", () => {
    expect(getBuilderBlockText(calculator, "zh-CN")).toEqual({
      name: "计算器",
      description: "对两个数执行数学运算。",
    });
    expect(getBuilderBlockText(calculator, "en")).toEqual({
      name: "Calculator",
      description: calculator.description,
    });
  });

  it.each([
    ["1ff065e9-88e8-4358-9d82-8dc91f622ba9", "StoreValueBlock", "存储值"],
    ["c0a8e994-ebf1-4a9c-a4d8-89d09c86741b", "AgentInputBlock", "工作流输入"],
    ["363ae599-353e-4804-937e-b2ee3cef3da4", "AgentOutputBlock", "工作流输出"],
  ])("matches %s by stable block ID", (id, name, chinese) => {
    expect(hasBuilderBlockCopy(id)).toBe(true);
    expect(getBuilderBlockText({ id, name }, "zh-CN").name).toBe(chinese);
  });

  it("does not translate an extension that happens to have the same name", () => {
    const extension = { ...calculator, id: "external", description: "Acme v3" };
    expect(hasBuilderBlockCopy(extension.id)).toBe(false);
    expect(getBuilderBlockText(extension, "zh-CN")).toEqual({
      name: "Calculator",
      description: "Acme v3",
    });
    expect(hasBuilderBlockCopy("constructor")).toBe(false);
  });

  it("does not replace a workflow name or a revised server description with old copy", () => {
    expect(
      getBuilderBlockText({ ...calculator, name: "Finance_Demo" }, "zh-CN")
        .name,
    ).toBe("Finance_Demo");
    expect(
      getBuilderBlockText(
        { ...calculator, description: "Revised behavior" },
        "zh-CN",
      ).description,
    ).toBe("Revised behavior");
  });

  it("localizes only known schema copy and categories", () => {
    expect(getBuilderSchemaText("Round Result", "zh-CN")).toBe("结果取整");
    expect(
      getBuilderSchemaText("The result of your calculation", "zh-CN"),
    ).toBe("计算结果");
    expect(getBuilderSchemaText("My Demo_2", "zh-CN")).toBe("My Demo_2");
    expect(getBuilderSchemaText("Result", "en")).toBe("Result");
    expect(getBuilderCategoryLabel("DEVELOPER_TOOLS", "zh-CN")).toBe(
      "开发工具",
    );
  });
});
