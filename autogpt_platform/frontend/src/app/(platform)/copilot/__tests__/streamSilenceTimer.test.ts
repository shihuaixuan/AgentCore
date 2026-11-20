import { afterEach, expect, it, vi } from "vitest";
import { scheduleSilenceCheck } from "../streamSilenceTimer";

afterEach(() => vi.useRealTimers());

it("fires once when a previously healthy stream stops delivering bytes", () => {
  vi.useFakeTimers();
  const onSilence = vi.fn();
  const deadline = Date.now() + 70_000;
  scheduleSilenceCheck(6_000, () => deadline - Date.now(), onSilence);
  vi.advanceTimersByTime(69_999);
  expect(onSilence).not.toHaveBeenCalled();
  vi.advanceTimersByTime(60_001);
  expect(onSilence).toHaveBeenCalledTimes(1);
});
