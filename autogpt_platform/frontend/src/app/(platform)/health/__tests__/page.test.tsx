import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HealthPage from "../page";

it("renders the health message through server translation", async () => {
  render(await HealthPage());
  expect(screen.getByText("服务运行正常")).toBeDefined();
});
