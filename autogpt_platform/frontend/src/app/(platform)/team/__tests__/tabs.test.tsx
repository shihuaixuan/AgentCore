import {
  getListExpertCredentialsMockHandler,
  getListExpertPodsMockHandler,
  getListExpertsMockHandler,
} from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { getGetV2ListLibraryAgentsMockHandler200 } from "@/app/api/__generated__/endpoints/library/library.msw";
import { getGetV1ListExecutionSchedulesForAUserMockHandler } from "@/app/api/__generated__/endpoints/schedules/schedules.msw";
import { getListCopilotSkillsMockHandler200 } from "@/app/api/__generated__/endpoints/skills/skills.msw";
import { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertPod } from "@/app/api/__generated__/models/expertPod";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import {
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import TeamPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/team",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: vi.fn(),
}));

function makeExpert(over: Partial<Expert> = {}): Expert {
  return {
    id: "expert-maria",
    name: "Maria",
    avatar_url: null,
    role: "Marketing Strategist",
    bio: null,
    skills: [],
    tagline: "Grows your brand while you sleep",
    identity: "You are Maria.",
    voice_preferences: null,
    boundaries: null,
    protected_soul_rules: [],
    is_template: false,
    source_template_id: "template-maria",
    is_archived: false,
    workflows: [],
    ...over,
  } as Expert;
}

/** Reads the value of one of a card's stat columns by its label. */
function getStatValue(card: HTMLElement, label: string) {
  const column = within(card).getByText(label).closest("div");
  return column?.querySelector("dd")?.textContent;
}

const maria = makeExpert();
const lee = makeExpert({ id: "expert-lee", name: "Lee", role: "Researcher" });

beforeEach(() => {
  server.use(
    getGetV1ListExecutionSchedulesForAUserMockHandler([]),
    getListExpertPodsMockHandler([]),
    getListExpertCredentialsMockHandler([]),
    getListCopilotSkillsMockHandler200([]),
    getGetV2ListLibraryAgentsMockHandler200(),
  );
});

describe("TeamPage layout", () => {
  test("shows the roster under a plain header, with no tabs", async () => {
    server.use(getListExpertsMockHandler([maria]));

    render(<TeamPage />);

    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Team" })).toBeDefined();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  test("lists every expert without pod sections", async () => {
    const growth: ExpertPod = {
      id: "pod-growth",
      name: "Growth",
      created_at: new Date("2026-08-14T00:00:00Z"),
    };
    server.use(
      getListExpertsMockHandler([makeExpert({ pod_id: "pod-growth" }), lee]),
      getListExpertPodsMockHandler([growth]),
    );

    render(<TeamPage />);

    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
    expect(screen.getByText("Researcher")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Growth" })).toBeNull();
  });
});

describe("TeamRoster toolbar", () => {
  test("localizes workspace team filters without changing the filtered experts", async () => {
    const pausedLee = makeExpert({
      ...lee,
      schedules_paused_at: new Date("2026-08-20T10:00:00Z"),
    });
    server.use(getListExpertsMockHandler([maria, pausedLee]));

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TeamPage />
      </LanguageProvider>,
    );

    const roster = screen.getByRole("region", { name: "专家" });
    await waitFor(() => {
      expect(
        roster.querySelector('a[href="/team/expert-maria"]'),
      ).not.toBeNull();
      expect(roster.querySelector('a[href="/team/expert-lee"]')).not.toBeNull();
    });
    await user.click(
      screen.getByRole("button", { name: "筛选专家：全部专家" }),
    );
    expect(
      await screen.findByRole("menuitemradio", { name: "全部专家" }),
    ).toBeDefined();
    expect(screen.getByRole("menuitemradio", { name: "已计划" })).toBeDefined();
    expect(
      screen.getByRole("menuitemradio", { name: "需要设置" }),
    ).toBeDefined();
    await user.click(screen.getByRole("menuitemradio", { name: "已暂停" }));

    expect(
      screen.getByRole("button", { name: "筛选专家：已暂停" }),
    ).toBeDefined();
    expect(roster.querySelector('a[href="/team/expert-lee"]')).not.toBeNull();
    expect(roster.querySelector('a[href="/team/expert-maria"]')).toBeNull();
  });

  test("search narrows the roster to matching experts", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([maria, lee]));

    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();

    await user.type(
      screen.getByRole("textbox", { name: "Search experts" }),
      "resear",
    );

    expect(screen.getByText("Researcher")).toBeDefined();
    expect(screen.queryByText("Marketing Strategist")).toBeNull();
    // Otto is pinned, but steps aside once the roster is narrowed.
    expect(screen.queryByText("General Office Assistant")).toBeNull();
  });

  test("says so when nothing matches the search", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([maria]));

    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();

    await user.type(
      screen.getByRole("textbox", { name: "Search experts" }),
      "nobody",
    );

    expect(
      screen.getByText("No experts match that search or filter."),
    ).toBeDefined();
  });

  test("the paused filter keeps only experts with paused schedules", async () => {
    const pausedLee = makeExpert({
      id: "expert-lee",
      name: "Lee",
      role: "Researcher",
      schedules_paused_at: new Date("2026-08-20T10:00:00Z"),
    });
    server.use(getListExpertsMockHandler([maria, pausedLee]));

    const user = userEvent.setup();
    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();

    await user.click(screen.getByRole("button", { name: /^Filter experts/ }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Paused" }),
    );

    expect(screen.getByText("Researcher")).toBeDefined();
    expect(screen.queryByText("Marketing Strategist")).toBeNull();
  });
});

describe("AutopilotCard", () => {
  test("counts Otto's own skills alongside team schedules and workflows", async () => {
    const scheduledMaria = makeExpert({
      ...maria,
      skills: ["Copywriting", "SEO"],
      workflows: [
        {
          id: "wf-1",
          store_listing_version_id: "slv-1",
          library_agent_id: null,
          graph_id: "graph-1",
          name: "Content Calendar",
          description: null,
          schedule_cron: null,
          schedule_id: null,
        },
      ],
    });
    const skilledLee = makeExpert({
      ...lee,
      skills: ["Copywriting", "Analytics"],
    });
    server.use(
      getListExpertsMockHandler([scheduledMaria, skilledLee]),
      getListCopilotSkillsMockHandler200([
        { name: "SEO", description: "Personal SEO checklist" },
      ]),
      getGetV1ListExecutionSchedulesForAUserMockHandler([
        {
          id: "sched-soon",
          name: "Content Calendar",
          user_id: "user-1",
          graph_id: "graph-1",
          graph_version: 1,
          cron: "0 7 * * *",
          input_data: {},
          next_run_time: "2099-01-01T07:00:00Z",
          expert_id: "expert-maria",
        },
      ]),
    );

    render(<TeamPage />);
    expect(await screen.findByText("Researcher")).toBeDefined();

    const autopilot = screen.getByRole("region", {
      name: "General Office Assistant",
    });
    await waitFor(() => expect(getStatValue(autopilot, "Skills")).toBe("1"));
    expect(getStatValue(autopilot, "Schedules")).toBe("1");
    expect(getStatValue(autopilot, "Workflows")).toBe("1");
  });

  test("leaves out empty totals even when an expert has eleven skills", async () => {
    server.use(
      getListExpertsMockHandler([
        makeExpert({
          skills: Array.from({ length: 11 }, (_, index) => `Skill ${index}`),
        }),
      ]),
    );

    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();

    const autopilot = screen.getByRole("region", {
      name: "General Office Assistant",
    });
    // A zero total is left out of the meta line rather than shown as "0".
    expect(within(autopilot).queryByText("Skills")).toBeNull();
    expect(within(autopilot).queryByText("Schedules")).toBeNull();
    expect(within(autopilot).queryByText("Workflows")).toBeNull();
    expect(within(autopilot).queryByText("Built in")).toBeNull();
    expect(within(autopilot).queryByText("Budget")).toBeNull();
    expect(within(autopilot).getByRole("link", { name: "Chat" })).toBeDefined();
    expect(within(autopilot).queryByRole("link", { name: "Edit" })).toBeNull();
  });

  test("links its body to the Otto page", async () => {
    server.use(getListExpertsMockHandler([maria]));

    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();

    const autopilot = screen.getByRole("region", {
      name: "General Office Assistant",
    });
    expect(
      within(autopilot)
        .getByRole("link", { name: "View General Office Assistant" })
        .getAttribute("href"),
    ).toBe("/team/autopilot");
  });
});
