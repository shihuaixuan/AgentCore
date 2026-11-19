import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useTrialFailure } from "../useTrialFailure";

it("localizes application trial failures and preserves unknown provider messages", () => {
  const { result } = renderHook(() => useTrialFailure("user-1"), {
    wrapper: LanguageProvider,
  });
  act(() =>
    result.current.reportFailure({
      userID: "user-1",
      error: new Error("Unable to cancel your trial."),
      fallback: "Unable to cancel your trial.",
    }),
  );
  expect(result.current.error).toBe("无法取消试用。");
  act(() =>
    result.current.reportFailure({
      userID: "user-1",
      error: new Error("Raw Stripe detail"),
      fallback: "Unable to cancel your trial.",
    }),
  );
  expect(result.current.error).toBe("Raw Stripe detail");
});
