import { describe, expect, test } from "vitest";
import { getCadenceLabel } from "./helpers";

describe("getCadenceLabel", () => {
  test.each([
    ["40 7 * * *", "每天 07:40 运行"],
    ["0 9 * * 1,3", "每周一、周三 09:00 运行"],
    ["0 9 1,15 * *", "每月 1、15 日 09:00 运行"],
    ["*/5 * * * *", "每 5 分钟运行"],
    ["0 */2 * * *", "每 2 小时运行"],
    ["30 * * * *", "每小时第 30 分钟运行"],
    ["0 9 1 * 1", "按计划运行"],
    ["not a cron", "按计划运行"],
  ])("localizes %s as %s", (cron, label) => {
    expect(getCadenceLabel(cron, "zh-CN")).toBe(label);
  });

  test.each([
    ["40 7 * * *", "Runs every day at 07:40"],
    ["0 9 * * 1,3", "Runs every Monday, Wednesday at 09:00"],
    ["0 9 1,15 * *", "Runs on day 1, 15 of every month at 09:00"],
    ["0 9 1 * 1", "Runs on a schedule"],
    ["not a cron", "Runs on a schedule"],
  ])("%s -> %s", (cron, label) => {
    expect(getCadenceLabel(cron)).toBe(label);
  });
});
