import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test } from "vitest";
import { AutoGPTBubble } from "./AutoGPTBubble";

describe("AutoGPTBubble", () => {
  test("shows the default assistant as the sender label", () => {
    render(<AutoGPTBubble text="Hello there." animate={false} />);

    expect(screen.getByText("General Office Assistant")).toBeDefined();
    expect(screen.queryByText("AutoGPT")).toBeNull();
  });
});
