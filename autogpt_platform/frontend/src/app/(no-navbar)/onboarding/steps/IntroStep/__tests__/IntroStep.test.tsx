import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@/tests/integrations/test-utils";
import { useOnboardingWizardStore } from "../../../store";
import { IntroStep } from "../IntroStep";
import { TEAM } from "../components/teamSceneHelpers";

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => motionPreference.reduced,
}));

beforeEach(() => {
  motionPreference.reduced = false;
  useOnboardingWizardStore.getState().reset();
});

function membersWaitingToEnter() {
  const team = screen.getByRole("list", { name: "Your team" });
  return within(team)
    .getAllByRole("listitem")
    .filter((member) => {
      const entrance = member.firstElementChild as HTMLElement;
      return entrance.style.opacity === "0";
    });
}

describe("IntroStep", () => {
  it("welcomes the user on the team slide and moves on to Otto", () => {
    render(<IntroStep slide="team" />);
    expect(screen.getByText("Welcome to AutoGPT")).toBeDefined();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your new team, ready on day one",
      }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Meet Otto" }));
    expect(useOnboardingWizardStore.getState().currentStep).toBe(2);
  });

  it("shows the Otto slide with its own Next button", () => {
    render(<IntroStep slide="autopilot" />);
    expect(
      screen.getByRole("heading", { name: "Meet Otto, your Head of AI." }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Next" })).toBeDefined();
    expect(screen.queryByText("Welcome to AutoGPT")).toBeNull();
  });

  it("introduces the team by occupational title, keeping Otto", () => {
    render(<IntroStep slide="team" />);
    const team = screen.getByRole("list", { name: "Your team" });
    const members = within(team).getAllByRole("listitem");
    expect(members).toHaveLength(TEAM.length);
    expect(within(members[0]).getByText("Otto")).toBeDefined();
    expect(within(members[0]).getByText("Head of AI")).toBeDefined();
    expect(members.slice(1).map((member) => member.textContent)).toEqual([
      "SEO Content Manager",
      "Sales Development Rep",
      "Bookkeeper",
      "Market Research Analyst",
      "Customer Success Manager",
      "Executive Assistant",
      "Application Security Engineer",
    ]);
    expect(members[1].querySelector("img")?.getAttribute("src")).toBe(
      "/experts/professional/expert-maria.webp",
    );
    expect(
      screen.getByText(
        "The SEO Content Manager drafts your blog posts. The Sales Development Rep finds your next customers.",
      ),
    ).toBeDefined();
  });

  it("brings the team in with an entrance animation", () => {
    render(<IntroStep slide="team" />);
    expect(membersWaitingToEnter()).toHaveLength(TEAM.length);
  });

  it("shows the finished team at once for people who ask for reduced motion", () => {
    motionPreference.reduced = true;
    render(<IntroStep slide="team" />);
    expect(membersWaitingToEnter()).toHaveLength(0);
  });

  it("shows the team without invented task states", () => {
    render(<IntroStep slide="team" />);
    expect(screen.queryAllByTestId("status-dot")).toHaveLength(0);
  });
});
