import { afterEach, expect, it, vi } from "vitest";
import { createBlockMenuSteps } from "../block-menu";
import { createConnectionSteps } from "../connections";
import { createWelcomeSteps } from "../welcome";
import { handleTutorialCancel } from "../../helpers";
import { Key, storage } from "@/services/storage/local-storage";
import Shepherd from "shepherd.js";
import { CSS_CLASSES } from "../../constants";
import { useControlPanelStore } from "../../../../../stores/controlPanelStore";

function chinese(_english: string, translation: string) {
  return translation;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  useControlPanelStore.getState().setForceOpenBlockMenu(false);
  storage.clean(Key.SHEPHERD_TOUR);
});

it("focuses the input and advances only for the matching block ID, even when the result title is Chinese", () => {
  vi.useFakeTimers();
  const tour = new Shepherd.Tour();
  vi.spyOn(tour, "next").mockImplementation(() => {});
  const step = createBlockMenuSteps(tour, chinese).find(
    (step) => step.id === "search-calculator",
  )!;
  expect(step.text).toContain("计算器");
  expect(step.text).not.toContain("Calculator");
  document.body.innerHTML = `<div data-id="blocks-control-search-bar"><input type="text" value="计算器"></div>
    <div data-id="blocks-control-search-results"><button data-id="block-card-other">Calculator</button></div>`;
  const results = document.querySelector(
    '[data-id="blocks-control-search-results"]',
  )!;
  tour.addStep(step);
  const currentStep = tour.getById("search-calculator")!;
  currentStep.trigger("show");
  try {
    vi.advanceTimersByTime(400);
    expect(document.activeElement).toBe(document.querySelector("input"));
    expect(tour.next).not.toHaveBeenCalled();
    const match = document.createElement("button");
    match.dataset.id = "block-card-b1ab9b1967a6406dabf52dba76d00c79";
    match.textContent = "计算器";
    results.append(match);
    vi.advanceTimersByTime(400);
    expect(match.classList.contains(CSS_CLASSES.HIGHLIGHT)).toBe(true);
    expect(tour.next).toHaveBeenCalledOnce();
    expect(document.querySelector("input")?.value).toBe("计算器");
  } finally {
    currentStep.trigger("hide");
  }
});

it("closes a skipped Chinese tutorial and keeps the original skipped storage token", async () => {
  const tour = new Shepherd.Tour();
  const canceled = vi.fn(() => handleTutorialCancel(tour));
  tour.on("cancel", canceled);
  const [welcome] = createWelcomeSteps(tour, chinese);
  const skip = welcome.buttons?.find((button) => button.text === "跳过教程");
  expect(skip).toBeDefined();
  await skip!.action!.call(tour);
  expect(canceled).toHaveBeenCalledOnce();
  expect(storage.get(Key.SHEPHERD_TOUR)).toBe("skipped");
});

it("translates the connection diagram but preserves its step ID and English fallback", () => {
  const diagram = createConnectionSteps({}, chinese).find(
    (step) => step.id === "connection-complete",
  );
  expect(diagram?.text).toContain("<span>计算器 1</span>");
  expect(diagram?.text).toContain("<span>计算器 2</span>");
  expect(
    createConnectionSteps({}).find((step) => step.id === diagram?.id)?.text,
  ).toContain("<span>Calculator 1</span>");
});
