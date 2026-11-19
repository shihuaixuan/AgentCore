import { expect, test } from "vitest";
import { getInvalidServerMessage, getServerFieldSchema } from "../helpers";

test("localizes server validation without changing accepted hosts or schemes", () => {
  const schema = getServerFieldSchema("database", "zh-CN");
  const empty = schema.safeParse("");
  expect(empty.success).toBe(false);
  if (!empty.success)
    expect(empty.error.issues[0].message).toBe("请输入服务器地址");
  expect(getInvalidServerMessage("database", "zh-CN")).toBe(
    "请输入有效的服务器地址，例如 db.example.com 或 db.example.com:5432（端口范围为 1-65535）",
  );
  expect(schema.parse(" db.example.com:5432 ")).toBe("db.example.com:5432");
  expect(schema.safeParse("db.example.com:65536").success).toBe(false);
  expect(
    getServerFieldSchema("database").safeParse("").error?.issues[0].message,
  ).toBe("Server is required");
});
