import { expect, test } from "vitest";
import { describeCron } from "../helpers";

test.each([
  ["0 9 * * 1-5", "每周一、周二、周三、周四、周五 09:00"],
  ["0 9 1,15 * *", "每月 1、15 日 09:00"],
  ["*/5 * * * *", "每 5 分钟"],
  ["invalid cron", "已安排"],
])(
  "passes the selected locale into the cron description for %s",
  (cron, expected) => {
    expect(describeCron(cron, "zh-CN")).toBe(expected);
  },
);

test("retains the English cron default", () => {
  expect(describeCron("0 9 * * *")).toBe("Every day at 09:00");
});
