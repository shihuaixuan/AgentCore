import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, test } from "vitest";
import { SoulPreviewPanel } from "./SoulPreviewPanel";

const baseProps = {
  avatarUrl: null,
  color: null,
  about: null,
  voiceLabel: null,
  kit: null,
};

describe("SoulPreviewPanel", () => {
  test("keeps the generic expert heading until a profession is picked", () => {
    render(<SoulPreviewPanel {...baseProps} title="AI Expert" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "AI Expert" }),
    ).toBeDefined();
  });

  test("renders the profession as the only identity heading", () => {
    render(<SoulPreviewPanel {...baseProps} title="Research Analyst" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Research Analyst" }),
    ).toBeDefined();
    expect(screen.getAllByText("Research Analyst")).toHaveLength(1);
  });
});
