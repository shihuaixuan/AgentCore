import { expect, it } from "vitest";
import { getOutputPinLabel } from "../pinLabel";

it("uses Chinese for declared output pins but leaves custom workflow and tool keys alone", () => {
  const schema = { properties: { result: { title: "Result" } } };
  expect(getOutputPinLabel("result", schema, "zh-CN")).toBe("结果");
  expect(getOutputPinLabel("result", undefined, "zh-CN")).toBe("result");
  expect(getOutputPinLabel("my_Report", schema, "zh-CN")).toBe("my_Report");
  expect(getOutputPinLabel("result", schema, "en")).toBe("Result");
});
