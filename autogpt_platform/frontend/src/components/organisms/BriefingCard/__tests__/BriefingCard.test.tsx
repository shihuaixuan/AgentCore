import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { BriefingResponse } from "@/app/api/__generated__/models/briefingResponse";
import type { BriefingRunItem } from "@/app/api/__generated__/models/briefingRunItem";
import { getListExpertIdentitiesMockHandler200 } from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { render, screen } from "@/tests/integrations/test-utils";
import { BriefingCard } from "../BriefingCard";

function makeItem(index: number): BriefingRunItem {
  return {
    expert_id: `exp-${index}`,
    expert_name: `Expert ${index}`,
    expert_avatar_url: null,
    agent_name: `Agent ${index}`,
    graph_id: `g-${index}`,
    execution_id: `run-${index}`,
    library_agent_id: `lib-${index}`,
    status: "COMPLETED",
    summary: `Summary ${index}`,
    link: `/library/agents/lib-${index}`,
  };
}

function makeBriefing(items: BriefingRunItem[]): BriefingResponse {
  return {
    id: "briefing-1",
    briefing_date: new Date("2026-08-12T00:00:00Z"),
    created_at: new Date("2026-08-12T00:00:00Z"),
    delivered_at: null,
    content: {
      generated_at: new Date("2026-08-12T00:00:00Z"),
      timezone: "UTC",
      zero_expert_fallback: false,
      run_items: items,
      decision_items: [],
    },
  };
}

const observedTargets: Element[] = [];

beforeEach(() => {
  observedTargets.length = 0;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(target: Element) {
        observedTargets.push(target);
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shares one roster fetch across archived, unknown and current run owners", async () => {
  let reads = 0;
  server.use(
    getListExpertIdentitiesMockHandler200(() => {
      reads += 1;
      return [
        {
          id: "exp-0",
          name: "Maria",
          avatar_url: "/autogpt-characters/v1.1/expert-maria/neutral/128.webp",
          role: "SEO & Content",
          job_title: "Editorial Lead",
          is_archived: true,
        },
        {
          id: "exp-3",
          name: "Unrelated name",
          avatar_url: null,
          role: "Ops",
          is_archived: false,
        },
      ];
    }),
  );
  render(
    <LanguageProvider>
      <BriefingCard
        briefing={makeBriefing([
          {
            ...makeItem(0),
            expert_name: null,
            summary: "Maria wrote a draft.",
          },
          { ...makeItem(1), summary: null, expert_role: "Sales" },
          { ...makeItem(2), expert_name: "Unrelated name", summary: null },
        ])}
      />
    </LanguageProvider>,
  );

  const avatar = await screen.findByRole("img", {
    name: "Editorial Lead，AI 专家",
  });
  expect(avatar.getAttribute("src")).toBe(
    "/experts/professional/expert-maria.webp",
  );
  expect(avatar.closest("a")?.getAttribute("href")).toBe(
    "/library/agents/lib-0",
  );
  expect(screen.getByText("Maria wrote a draft.")).toBeDefined();
  expect(screen.getByText("销售开发代表")).toBeDefined();
  expect(screen.getByText("AI 专家")).toBeDefined();
  expect(screen.queryByText("Unrelated name")).toBeNull();
  expect(screen.queryByText("行政助理")).toBeNull();
  expect(reads).toBe(1);
});

test("keeps Otto's label on a legacy recap, without promoting a named expert to Otto", () => {
  render(
    <BriefingCard
      briefing={makeBriefing([
        { ...makeItem(0), expert_id: null, expert_name: "Otto", summary: null },
        {
          ...makeItem(1),
          expert_name: "Otto",
          expert_role: "Sales",
          summary: null,
        },
      ])}
    />,
  );

  expect(screen.getByText("Otto").closest("li")?.textContent).toContain(
    "Agent 0",
  );
  expect(
    screen.getByText("Sales Development Rep").closest("li")?.textContent,
  ).toContain("Agent 1");
});

test("keeps clipped rows out of the tab order until the list is expanded", async () => {
  const { container } = render(
    <BriefingCard briefing={makeBriefing([0, 1, 2, 3].map(makeItem))} />,
  );

  const clipped = container.querySelectorAll("li")[3];
  expect(clipped.getAttribute("aria-hidden")).toBe("true");
  expect(clipped.querySelector("a")?.getAttribute("tabindex")).toBe("-1");
  expect(screen.queryByRole("link", { name: /Agent 3/ })).toBeNull();

  await userEvent.click(
    screen.getByRole("button", { name: /Show all results \(4\)/ }),
  );

  const expanded = screen.getByRole("link", { name: /Agent 3/ });
  expect(expanded.getAttribute("tabindex")).toBeNull();
  expect(expanded.closest("li")?.getAttribute("aria-hidden")).toBeNull();
});

test("badges a run that did not complete, and only that run", () => {
  render(
    <BriefingCard
      briefing={makeBriefing([
        makeItem(0),
        { ...makeItem(1), status: "FAILED" },
      ])}
    />,
  );

  const failedRow = screen.getByText("Agent 1").closest("li");
  expect(failedRow?.textContent).toContain("Failed");
  expect(screen.getByText("Agent 0").closest("li")?.textContent).not.toContain(
    "Failed",
  );
});

test("jumps back to the top when the list collapses", async () => {
  const { container } = render(
    <BriefingCard briefing={makeBriefing([0, 1, 2, 3].map(makeItem))} />,
  );
  const list = container.querySelector("ul") as HTMLUListElement;
  const scrollTo = vi.fn();
  list.scrollTo = scrollTo;

  const toggle = screen.getByRole("button", { name: /Show all results/ });
  await userEvent.click(toggle);
  expect(scrollTo).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: /Show less/ }));
  expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
});

test("re-observes the rows when the briefing refetches a different run list", () => {
  const { rerender } = render(
    <BriefingCard briefing={makeBriefing([0, 1].map(makeItem))} />,
  );
  observedTargets.length = 0;

  rerender(<BriefingCard briefing={makeBriefing([0, 1, 2].map(makeItem))} />);

  expect(
    observedTargets.some((target) => target.textContent?.includes("Agent 2")),
  ).toBe(true);
});
