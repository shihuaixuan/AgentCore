import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AutopilotAvatar } from "./AutopilotAvatar";

test("uses the office portrait at normal and transparent sizes", () => {
  const { rerender } = render(<AutopilotAvatar size={80} />);
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "/experts/professional/office-assistant.webp",
  );

  rerender(<AutopilotAvatar size={160} transparent />);
  const image = screen.getByRole("img", {
    name: "通用办公助手, your personal Head of AI",
  });
  expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
    "/experts/professional/office-assistant.webp",
  );
  expect(image.getAttribute("width")).toBe("160");
  expect(image.getAttribute("height")).toBe("160");
  expect(image.getAttribute("sizes")).toBe("160px");

  rerender(<AutopilotAvatar />);
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "/experts/professional/office-assistant.webp",
  );
});
