import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "@/components/molecules/Toast/toaster";
import { toastHireFailed } from "../plan-hire-helpers";

describe("onboarding hire failure localization", () => {
  afterEach(() => sonnerToast.dismiss());

  it("localizes the whole notification while keeping expert names unchanged", async () => {
    render(<Toaster />);
    toastHireFailed(["凯西", "Custom Expert"], "zh-CN");
    expect(
      await screen.findByText("未能聘用凯西、Custom Expert"),
    ).toBeDefined();
    expect(
      await screen.findByText("这些任务暂由助手负责。你随时可以聘用专家。"),
    ).toBeDefined();
  });
});
