import {
  getArchiveExpertMockHandler,
  getArchiveExpertMockHandler401,
  getGetExpertDetachPreviewMockHandler,
  getListExpertCredentialsMockHandler,
  getListExpertPodsMockHandler,
  getListExpertSetupItemsMockHandler,
  getListExpertsMockHandler,
  getListExpertsMockHandler401,
  getResumeExpertSchedulesMockHandler,
  getUpdateExpertSoulMockHandler,
  getUpdateExpertSoulMockHandler422,
} from "@/app/api/__generated__/endpoints/experts/experts.msw";
import {
  getGetV2ListLibraryAgentsMockHandler200,
  getGetV2ListLibraryAgentsResponseMock200,
} from "@/app/api/__generated__/endpoints/library/library.msw";
import { getGetV1ListProvidersMockHandler } from "@/app/api/__generated__/endpoints/integrations/integrations.msw";
import { getListMyExpertMemoryFactsMockHandler200 } from "@/app/api/__generated__/endpoints/memory/memory.msw";
import { getGetV1ListExecutionSchedulesForAUserMockHandler } from "@/app/api/__generated__/endpoints/schedules/schedules.msw";
import type { ExpertSetupItem } from "@/app/api/__generated__/models/expertSetupItem";
import { Expert } from "@/app/api/__generated__/models/expert";
import { GraphExecutionJobInfo } from "@/app/api/__generated__/models/graphExecutionJobInfo";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { getGetV2ListSessionsMockHandler200 } from "@/app/api/__generated__/endpoints/chat/chat.msw";
import { server } from "@/mocks/mock-server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import TeamPage from "../page";

vi.mock("@/lib/oauth-popup", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/oauth-popup")>();
  return {
    ...actual,
    preOpenOAuthPopup: () => null,
    openOAuthPopup: () => ({
      promise: Promise.resolve({ code: "code", state: "state" }),
      cleanup: { abort: () => {} },
      popupBlocked: false,
      fallbackBlocked: false,
    }),
  };
});

vi.mock("framer-motion", async (importActual) => {
  const actual = await importActual<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => true };
});

const toastMock = vi.hoisted(() => vi.fn());
const autoModeFlag = vi.hoisted(() => ({ enabled: false }));

function libraryResponse(
  agents: LibraryAgent[],
  totalItems = agents.length,
  currentPage = 1,
) {
  const base = getGetV2ListLibraryAgentsResponseMock200();
  return {
    ...base,
    agents,
    pagination: {
      ...base.pagination,
      total_items: totalItems,
      current_page: currentPage,
      page_size: 100,
      total_pages: Math.ceil(totalItems / 100),
    },
  };
}

function makeSchedule(
  over: Partial<GraphExecutionJobInfo> = {},
): GraphExecutionJobInfo {
  return {
    id: "sched-1",
    name: "Content Calendar",
    user_id: "user-1",
    graph_id: "graph-1",
    graph_version: 1,
    cron: "40 7 * * *",
    input_data: {},
    next_run_time: "2026-08-15T07:40:00Z",
    expert_id: "expert-maria",
    ...over,
  };
}

/** Reads the value of one of the expert card's stat rows by its label. */
function getStatValue(card: HTMLElement, label: string) {
  const row = within(card).getByText(label).closest("div");
  return row?.querySelector("dd")?.textContent;
}

beforeEach(() => {
  server.use(
    getGetV1ListExecutionSchedulesForAUserMockHandler([]),
    getListExpertPodsMockHandler([]),
    getListExpertCredentialsMockHandler([]),
    getListExpertSetupItemsMockHandler([]),
    getListMyExpertMemoryFactsMockHandler200({
      expert_id: "expert-maria",
      items: [],
    }),
    getGetV1ListProvidersMockHandler([]),
    getGetV2ListLibraryAgentsMockHandler200(libraryResponse([])),
  );
});

afterEach(() => {
  autoModeFlag.enabled = false;
  toastMock.mockReset();
});

vi.mock("@/components/molecules/Toast/use-toast", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/components/molecules/Toast/use-toast")
    >();
  return { ...actual, toast: toastMock };
});

vi.mock("@/services/feature-flags/use-get-flag", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/services/feature-flags/use-get-flag")
    >();
  return {
    ...actual,
    useGetFlag: (flag: string) =>
      flag === actual.Flag.COPILOT_AUTO_MODE
        ? autoModeFlag.enabled
        : actual.useGetFlag(flag as never),
  };
});

const notFoundMock = vi.hoisted(() => vi.fn());
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
  notFound: () => {
    notFoundMock();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const hiredMaria: Expert = {
  id: "expert-maria",
  name: "Maria",
  avatar_url: null,
  role: "Marketing Strategist",
  bio: null,
  skills: [],
  tagline: "Grows your brand while you sleep",
  identity: "You are Maria, a senior marketing strategist.",
  voice_preferences: "Warm, concise, and direct.",
  boundaries: "Never invent customer evidence.",
  protected_soul_rules: [
    "The expert discloses that it is AI when acting externally.",
    "The expert asks for approval before acting externally.",
  ],
  is_template: false,
  source_template_id: "template-maria",
  is_archived: false,
  workflows: [
    {
      id: "wf-1",
      store_listing_version_id: "slv-1",
      library_agent_id: "lib-1",
      graph_id: "graph-1",
      name: "Content Calendar",
      description: null,
    },
    {
      id: "wf-2",
      store_listing_version_id: "slv-2",
      library_agent_id: "lib-2",
      graph_id: "graph-2",
      name: "SEO Audit",
      description: null,
    },
  ],
};

const scheduledMaria: Expert = {
  ...hiredMaria,
  last_run_at: new Date("2026-08-03T07:40:00Z"),
  last_run_status: "COMPLETED",
  workflows: [
    {
      ...hiredMaria.workflows[0],
      schedule_cron: "40 7 * * *",
      schedule_id: "sched-1",
    },
    hiredMaria.workflows[1],
  ],
};

const hiredCasey: Expert = {
  ...hiredMaria,
  id: "hired-casey",
  name: "Casey",
  role: "Code Review & QA",
  job_title: "QA Engineer",
  avatar_url: "/autogpt-characters/v2.1/expert-casey/neutral/128.webp",
  source_template_id: "expert-casey",
  tagline: null,
  identity: "Review proposed changes and report regressions.",
  workflows: [],
};

describe("TeamPage", () => {
  test("identifies Casey only by profession on the roster and in the chat drawer", async () => {
    server.use(
      getListExpertsMockHandler([hiredCasey]),
      getGetV2ListSessionsMockHandler200({ sessions: [], total: 0 }),
    );
    const user = userEvent.setup();
    render(<TeamPage />);

    const card = await screen.findByRole("link", { name: "View QA Engineer" });
    expect(card.getAttribute("href")).toBe("/team/hired-casey");
    expect(within(card).getByText("QA Engineer")).toBeDefined();
    const portrait = within(card).getByRole("img", {
      name: "QA Engineer, AI Expert",
    });
    expect(portrait.getAttribute("src")).toBe(
      "/experts/professional/expert-casey.webp",
    );
    await user.click(screen.getAllByRole("button", { name: "Chat" })[1]);
    const chat = await screen.findByRole("complementary", {
      name: "Chat with QA Engineer",
    });
    expect(await within(chat).findByText("QA Engineer")).toBeDefined();
    expect(
      within(chat).getByPlaceholderText("Message QA Engineer…"),
    ).toBeDefined();
    expect(screen.queryByText(/\bCasey\b/)).toBeNull();
    expect(screen.queryByAltText(/\bCasey\b/)).toBeNull();
  });

  test("searches by the displayed profession, not the legacy name", async () => {
    server.use(getListExpertsMockHandler([hiredCasey]));
    const user = userEvent.setup();
    render(<TeamPage />);

    const search = await screen.findByRole("textbox", {
      name: "Search experts",
    });
    await user.type(search, "Casey");
    expect(
      await screen.findByText("No experts match that search or filter."),
    ).toBeDefined();
    await user.clear(search);
    await user.type(search, "QA Engineer");
    expect(
      await screen.findByRole("link", { name: "View QA Engineer" }),
    ).toBeDefined();
  });

  test("renders the Otto card first", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const autopilot = await screen.findByText("Otto");
    expect(screen.getByText("Head of AI")).toBeDefined();

    const maria = await screen.findByText("Marketing Strategist");
    expect(
      autopilot.compareDocumentPosition(maria) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("header exposes expert actions without pod creation", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const raise = await screen.findByRole("link", { name: "Create an Expert" });
    expect(raise.getAttribute("href")).toBe("/raise");
    expect(
      screen.getByRole("link", { name: "Hire expert" }).getAttribute("href"),
    ).toBe("/marketplace#experts");

    expect(screen.queryByRole("button", { name: "New Pod" })).toBeNull();
  });

  test("renders hired experts with a stat strip instead of chips", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(within(card).getByText("Marketing Strategist")).toBeDefined();
    expect(within(card).queryByText("Idle")).toBeNull();
    expect(getStatValue(card, "Workflows")).toBe("2");
    // Empty totals are left off the meta line.
    expect(within(card).queryByText("Skills")).toBeNull();
    expect(within(card).queryByText("Content Calendar")).toBeNull();
    expect(within(card).queryByText("SEO Audit")).toBeNull();
  });

  test("badges an expert whose new chats start unsupervised", async () => {
    autoModeFlag.enabled = true;
    server.use(
      getListExpertsMockHandler([
        { ...hiredMaria, autopilot_mode: "unsupervised" },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(within(card).getByText("Unsupervised")).toBeDefined();
  });

  test("hides the unsupervised badge while approval modes are off", async () => {
    server.use(
      getListExpertsMockHandler([
        { ...hiredMaria, autopilot_mode: "unsupervised" },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(within(card).queryByText("Unsupervised")).toBeNull();
  });

  test("links the card content to the expert page", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const link = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(link.getAttribute("href")).toBe("/team/expert-maria");
  });

  test("opens an inline chat from the expert and Otto cards", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getGetV2ListSessionsMockHandler200({ sessions: [], total: 0 }),
    );
    const user = userEvent.setup();

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    const [autopilotChat, mariaChat] = screen.getAllByRole("button", {
      name: "Chat",
    });

    await user.click(mariaChat);
    const mariaPanel = screen.getByRole("complementary", {
      name: "Chat with Marketing Strategist",
    });
    expect(
      await within(mariaPanel).findByText("What can I do for you?"),
    ).toBeDefined();
    expect(
      within(mariaPanel).getByPlaceholderText("Message Marketing Strategist…"),
    ).toBeDefined();

    await user.click(autopilotChat);
    const autopilotPanel = await screen.findByRole("complementary", {
      name: "Chat with Otto",
    });
    expect(
      within(autopilotPanel).getByPlaceholderText("Message Otto…"),
    ).toBeDefined();
    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", {
          name: "Chat with Marketing Strategist",
        }),
      ).toBeNull();
    });

    expect(
      screen.getByRole("button", { name: "Install workflow" }),
    ).toBeDefined();
  });

  test("shows an expert's integrations as logos, the rest behind +N more", async () => {
    const user = userEvent.setup();
    const credentialRequests = vi.fn();
    server.use(
      getListExpertsMockHandler([
        {
          ...hiredMaria,
          credential_count: 5,
          credential_providers: [
            "github",
            "linear",
            "figma",
            "notion",
            "slack",
          ],
        },
      ]),
      http.get("*/api/experts/:expertId/credentials", () => {
        credentialRequests();
        return HttpResponse.json([]);
      }),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    const integrations = within(card).getByRole("list", {
      name: "Integrations",
    });
    const logos = within(integrations).getAllByRole("img");
    expect(logos.map((logo) => logo.getAttribute("alt"))).toEqual([
      "GitHub",
      "Linear",
      "Figma",
    ]);
    expect(logos.map((logo) => logo.getAttribute("src"))).toEqual([
      "/integrations/github.png",
      "/integrations/linear.png",
      "/integrations/figma.png",
    ]);
    // The roster response already carries the providers; no per-card fetch.
    expect(credentialRequests).not.toHaveBeenCalled();

    // Inside the card link nothing may take focus, so the names ride along
    // as screen-reader text and the tooltip is the pointer affordance.
    const more = within(integrations).getByText("+2 more");
    expect(more.getAttribute("tabindex")).toBeNull();
    expect(more.textContent).toContain("Notion, Slack");
    await user.hover(more);
    await screen.findByRole("tooltip", { name: "Notion, Slack" });
  });

  test("a logo says on hover whose account it is", async () => {
    const user = userEvent.setup();
    server.use(
      getListExpertsMockHandler([
        {
          ...hiredMaria,
          credential_count: 1,
          credential_providers: ["github"],
        },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    await user.hover(within(card).getByRole("img", { name: "GitHub" }));
    await screen.findByRole("tooltip", {
      name: "Marketing Strategist has access to your GitHub account",
    });
  });

  test("uses plain covers for built-in experts", async () => {
    server.use(
      getListExpertsMockHandler([
        hiredMaria,
        {
          ...hiredMaria,
          id: "expert-max",
          name: "Max",
          role: "Researcher",
          avatar_url: "/experts/max.svg",
        },
      ]),
    );

    render(<TeamPage />);

    const max = await screen.findByRole("link", { name: "View Researcher" });
    expect(
      max.querySelector('img[src="/experts/covers/max-1.jpg"]'),
    ).toBeNull();
    const maria = screen.getByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(maria.querySelector('img[src^="/experts/covers/"]')).toBeNull();
    const otto = screen.getByRole("link", { name: "View Otto" });
    expect(otto.querySelector('img[src^="/experts/covers/"]')).toBeNull();
  });

  test("shows no integrations item on a card with none granted", async () => {
    server.use(
      getListExpertsMockHandler([
        { ...hiredMaria, credential_count: 0, credential_providers: [] },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(getStatValue(card, "Workflows")).toBe("2");
    expect(
      within(card).queryByRole("list", { name: "Integrations" }),
    ).toBeNull();
  });

  test("counts an expert's schedules on their card", async () => {
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const mariaSchedule = makeSchedule({
      next_run_time: inTwoDays.toISOString(),
    });
    server.use(
      getListExpertsMockHandler([scheduledMaria]),
      getGetV1ListExecutionSchedulesForAUserMockHandler([mariaSchedule]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(getStatValue(card, "Schedules")).toBe("1");
  });

  test("keeps the roster when only the schedules query fails", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      http.get(
        "*/api/schedules",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    render(<TeamPage />);

    expect(
      await screen.findByRole("link", { name: "View Marketing Strategist" }),
    ).toBeDefined();
    // The roster loaded, so the page must not claim it could not.
    await waitFor(() =>
      expect(
        screen.queryByText("We could not load your hired experts."),
      ).toBeNull(),
    );
  });

  test("does not badge a card for a workflow without a schedule", async () => {
    const needsSetupMaria: Expert = {
      ...hiredMaria,
      workflows: [
        {
          ...hiredMaria.workflows[0],
          schedule_cron: "40 7 * * *",
          schedule_id: null,
        },
      ],
    };
    server.use(getListExpertsMockHandler([needsSetupMaria]));

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    // The Setup needed card above the roster owns that state now.
    expect(screen.queryByText(/needs setup/i)).toBeNull();
    expect(screen.queryByText("Needs you")).toBeNull();
  });

  test("marks an expert with an active run as working", async () => {
    server.use(
      getListExpertsMockHandler([
        { ...hiredMaria, last_run_status: "RUNNING" },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(within(card).getByText("Working")).toBeDefined();
  });

  test("shows weekly spend as a progress bar on the expert card", async () => {
    const budgetMaria: Expert = {
      ...hiredMaria,
      weekly_budget: 5000,
      weekly_spend: 1200,
    };
    server.use(getListExpertsMockHandler([budgetMaria]));

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    expect(screen.getByText("Budget")).toBeDefined();
    expect(screen.getByText("$12 / $50")).toBeDefined();
  });

  test("paused expert offers one-click resume", async () => {
    const pausedMaria: Expert = {
      ...hiredMaria,
      schedules_paused_at: new Date("2026-08-03T12:00:00Z"),
    };
    const resumeSpy = vi.fn(() => ({
      ...pausedMaria,
      schedules_paused_at: null,
    }));
    server.use(
      getListExpertsMockHandler([pausedMaria]),
      getResumeExpertSchedulesMockHandler(resumeSpy),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    expect(screen.getByText(/Schedules paused/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Resume schedules" }));
    await waitFor(() => expect(resumeSpy).toHaveBeenCalled());
  });

  test("opens the current Soul document from the expert card", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: "Edit Soul" }));

    expect(screen.queryByRole("textbox", { name: "Name" })).toBeNull();
    const panel = screen.getByRole("complementary", {
      name: "Marketing Strategist's Soul",
    });
    expect(
      (
        screen.getByRole("textbox", {
          name: "Identity and personality",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("You are Maria, a senior marketing strategist.");
    expect(
      (screen.getByRole("textbox", { name: "Voice" }) as HTMLTextAreaElement)
        .value,
    ).toBe("Warm, concise, and direct.");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Boundaries",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Never invent customer evidence.");
    expect(
      screen.getByText(
        "The expert discloses that it is AI when acting externally.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "The expert asks for approval before acting externally.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "These rules are part of every expert's soul and cannot be edited.",
      ),
    ).toBeDefined();
    expect(within(panel).getAllByRole("textbox")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });

  test("closes the Soul panel from its cancel action", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: "Edit Soul" }));
    expect(
      screen.getByRole("complementary", {
        name: "Marketing Strategist's Soul",
      }),
    ).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", {
          name: "Marketing Strategist's Soul",
        }),
      ).toBeNull();
    });
  });

  test("opens only the Soul panel when activated with the keyboard", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const editSoul = await screen.findByRole("button", { name: "Edit Soul" });
    editSoul.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("complementary", {
        name: "Marketing Strategist's Soul",
      }),
    ).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("keeps nested card actions independent for keyboard users", async () => {
    const user = userEvent.setup();
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    const installWorkflow = await screen.findByRole("button", {
      name: "Install workflow",
    });
    installWorkflow.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("dialog", { name: /Install a workflow/ }),
    ).toBeDefined();
    expect(
      screen.queryByRole("complementary", {
        name: "Marketing Strategist's Soul",
      }),
    ).toBeNull();
  });

  test("saves Soul edits with the unchanged legacy name and refreshes the roster", async () => {
    const user = userEvent.setup();
    let listRequests = 0;
    let requestBody: unknown;
    const updatedMaria = { ...hiredMaria, voice_preferences: "Calm." };
    server.use(
      getListExpertsMockHandler(() => {
        listRequests += 1;
        return listRequests === 1 ? [hiredMaria] : [updatedMaria];
      }),
      getUpdateExpertSoulMockHandler(async ({ request }) => {
        requestBody = await request.json();
        return updatedMaria;
      }),
    );

    render(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: "Edit Soul" }));
    const voiceInput = screen.getByRole("textbox", { name: "Voice" });
    await user.clear(voiceInput);
    await user.type(voiceInput, "Calm.");
    await user.click(screen.getByRole("button", { name: "Save Soul" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Soul saved", variant: "success" }),
      ),
    );
    expect(listRequests).toBeGreaterThan(1);
    expect(requestBody).toEqual({
      name: "Maria",
      identity: hiredMaria.identity,
      voice_preferences: "Calm.",
      boundaries: hiredMaria.boundaries,
    });
  });

  test("round-trips a hire-flow voice pick through the Soul editor without clobbering it", async () => {
    const user = userEvent.setup();
    const pickedVoice =
      "Preferred writing style: Punchy and bold.\n\nExample to match:\n\nStop guessing what your buyers want.";
    let requestBody: unknown;
    server.use(
      getListExpertsMockHandler([
        { ...hiredMaria, voice_preferences: pickedVoice },
      ]),
      getUpdateExpertSoulMockHandler(async ({ request }) => {
        requestBody = await request.json();
        return { ...hiredMaria, voice_preferences: pickedVoice };
      }),
    );

    render(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: "Edit Soul" }));
    const voiceInput = screen.getByRole("textbox", {
      name: "Voice",
    }) as HTMLTextAreaElement;
    expect(voiceInput.value).toBe(pickedVoice);

    const boundaries = screen.getByRole("textbox", { name: "Boundaries" });
    await user.type(boundaries, " Ask before sending.");
    await user.click(screen.getByRole("button", { name: "Save Soul" }));

    // An unrelated Soul edit must carry the chosen voice through untouched.
    await waitFor(() => expect(requestBody).toBeDefined());
    expect(requestBody).toEqual(
      expect.objectContaining({
        name: "Maria",
        voice_preferences: pickedVoice,
        boundaries: `${hiredMaria.boundaries} Ask before sending.`,
      }),
    );
  });

  test("preserves Soul edits and shows feedback when saving fails", async () => {
    const user = userEvent.setup();
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getUpdateExpertSoulMockHandler422(),
    );

    render(<TeamPage />);

    await user.click(await screen.findByRole("button", { name: "Edit Soul" }));
    const voiceInput = screen.getByRole("textbox", { name: "Voice" });
    await user.clear(voiceInput);
    await user.type(voiceInput, "Calm and conversational.");
    await user.click(screen.getByRole("button", { name: "Save Soul" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Couldn't save Soul",
          variant: "destructive",
        }),
      ),
    );
    expect((voiceInput as HTMLTextAreaElement).value).toBe(
      "Calm and conversational.",
    );
    expect(
      screen.getByRole("complementary", {
        name: "Marketing Strategist's Soul",
      }),
    ).toBeDefined();
  });

  test("states what firing pauses from the detach preview", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getGetExpertDetachPreviewMockHandler({
        schedule_names: ["Content Calendar"],
        trigger_names: ["Inbox watcher"],
      }),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Fire Marketing Strategist?",
    });
    expect(
      within(dialog).getByText("Installed workflows stay in your library."),
    ).toBeDefined();
    expect(
      await within(dialog).findByText("2 automations will pause."),
    ).toBeDefined();
    expect(
      within(dialog).getByText(
        "Any chat history stays available but read-only.",
      ),
    ).toBeDefined();
    expect(within(dialog).getByText("Their work stays yours.")).toBeDefined();
    expect(within(dialog).getByText("Content Calendar")).toBeDefined();
    expect(within(dialog).getByText("Inbox watcher")).toBeDefined();
  });

  test("fires an expert and drops them from the roster with a re-hire toast", async () => {
    let listRequests = 0;
    const archiveSpy = vi.fn();
    server.use(
      getListExpertsMockHandler(() => {
        listRequests += 1;
        return listRequests === 1 ? [hiredMaria] : [];
      }),
      getGetExpertDetachPreviewMockHandler({
        schedule_names: [],
        trigger_names: [],
      }),
      getArchiveExpertMockHandler(archiveSpy),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );
    const confirm = await screen.findByTestId("fire-expert-confirm");
    await waitFor(() => expect(confirm.hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirm);

    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText("Marketing Strategist")).toBeNull(),
    );
    expect(listRequests).toBeGreaterThan(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description:
          "You can re-hire Marketing Strategist anytime from the marketplace.",
      }),
    );
  });

  test("ignores escape while the fire request is in flight", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getGetExpertDetachPreviewMockHandler({
        schedule_names: [],
        trigger_names: [],
      }),
      http.delete("*/api/experts/expert-maria", async () => {
        await delay(80);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );
    const confirm = await screen.findByTestId("fire-expert-confirm");
    await waitFor(() => expect(confirm.hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirm);

    // "Keep Marketing Strategist" is disabled during the request, so ESC must not be an
    // escape hatch that drops the user out before the outcome is known.
    const dialog = await screen.findByRole("dialog", {
      name: "Fire Marketing Strategist?",
    });
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(
      screen.getByRole("dialog", { name: "Fire Marketing Strategist?" }),
    ).toBeDefined();

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Fire Marketing Strategist?" }),
      ).toBeNull(),
    );
  });

  test("blocks firing until the detach preview resolves", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      http.get("*/api/experts/expert-maria/detach-preview", async () => {
        await delay(60);
        return HttpResponse.json({
          schedule_names: [],
          trigger_names: [],
        });
      }),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Fire Marketing Strategist?",
    });
    expect(within(dialog).getByText("Checking what will pause…")).toBeDefined();
    expect(
      screen.getByTestId("fire-expert-confirm").hasAttribute("disabled"),
    ).toBe(true);

    await waitFor(() =>
      expect(
        screen.getByTestId("fire-expert-confirm").hasAttribute("disabled"),
      ).toBe(false),
    );
  });

  test("surfaces an error with retry when the detach preview fails", async () => {
    let previewRequests = 0;
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      http.get("*/api/experts/expert-maria/detach-preview", () => {
        previewRequests += 1;
        if (previewRequests === 1) {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json({
          schedule_names: [],
          trigger_names: [],
        });
      }),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Fire Marketing Strategist?",
    });
    expect(
      await within(dialog).findByText(
        "We couldn't preview what pauses, but you can still fire them.",
      ),
    ).toBeDefined();
    expect(
      screen.getByTestId("fire-expert-confirm").hasAttribute("disabled"),
    ).toBe(false);

    fireEvent.click(screen.getByTestId("fire-preview-retry"));

    expect(
      await within(dialog).findByText("No automations will pause."),
    ).toBeDefined();
    expect(screen.queryByTestId("fire-preview-retry")).toBeNull();
  });

  test("fires the expert even when the detach preview fails", async () => {
    const archiveSpy = vi.fn();
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      http.get(
        "*/api/experts/expert-maria/detach-preview",
        () => new HttpResponse(null, { status: 404 }),
      ),
      getArchiveExpertMockHandler(archiveSpy),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Fire Marketing Strategist?",
    });
    await within(dialog).findByText(
      "We couldn't preview what pauses, but you can still fire them.",
    );
    const confirm = screen.getByTestId("fire-expert-confirm");
    expect(confirm.hasAttribute("disabled")).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });

  test("keeps the expert and warns when firing fails", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getGetExpertDetachPreviewMockHandler({
        schedule_names: [],
        trigger_names: [],
      }),
      getArchiveExpertMockHandler401(),
    );

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    fireEvent.pointerDown(screen.getByTestId("expert-card-actions"), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Fire Marketing Strategist",
      }),
    );
    const confirm = await screen.findByTestId("fire-expert-confirm");
    await waitFor(() => expect(confirm.hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Could not fire Marketing Strategist",
          description:
            "Marketing Strategist is still on your team. Please try again.",
          variant: "destructive",
        }),
      ),
    );
    expect(screen.getByText("Marketing Strategist")).toBeDefined();
  });

  test("shows empty state linking to the marketplace when no experts are hired", async () => {
    server.use(getListExpertsMockHandler([]));

    render(<TeamPage />);

    expect(await screen.findByText("Otto")).toBeDefined();
    const link = await screen.findByRole("link", {
      name: "Browse the marketplace",
    });
    expect(link.getAttribute("href")).toBe("/marketplace");
    for (const createLink of screen.getAllByRole("link", {
      name: "Create an Expert",
    })) {
      expect(createLink.getAttribute("href")).toBe("/raise");
    }
  });

  test("shows an error card and retries when loading experts fails", async () => {
    server.use(getListExpertsMockHandler401());

    render(<TeamPage />);

    expect(await screen.findByText("Something went wrong")).toBeDefined();

    server.use(getListExpertsMockHandler([hiredMaria]));
    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));

    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });

  test("renders the roster without waiting for pods", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getListExpertPodsMockHandler(() => new Promise(() => {})),
    );

    render(<TeamPage />);

    await screen.findByText("Otto");
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
  });

  test("renders the roster without requesting pods", async () => {
    const podsRequest = vi.fn();
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getListExpertPodsMockHandler(() => {
        podsRequest();
        throw new Error("Pods must not be requested");
      }),
    );

    render(<TeamPage />);

    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
    expect(screen.queryByText("Something went wrong")).toBeNull();
    expect(podsRequest).not.toHaveBeenCalled();
  });

  test("loads the expert roster without a rollout flag", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));
    notFoundMock.mockClear();
    render(<TeamPage />);
    expect(await screen.findByText("Marketing Strategist")).toBeDefined();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  test("does not mark the card as needing setup when a stale id has a live job", async () => {
    const staleButLiveMaria: Expert = {
      ...hiredMaria,
      workflows: [
        {
          ...hiredMaria.workflows[0],
          schedule_cron: "40 7 * * *",
          schedule_id: "deleted-schedule",
        },
      ],
    };
    server.use(
      getListExpertsMockHandler([staleButLiveMaria]),
      getGetV1ListExecutionSchedulesForAUserMockHandler([makeSchedule()]),
    );

    render(<TeamPage />);

    const card = await screen.findByRole("link", {
      name: "View Marketing Strategist",
    });
    expect(within(card).queryByText(/needs setup/i)).toBeNull();
  });
});

function makeSetupItem(
  overrides: Partial<ExpertSetupItem> = {},
): ExpertSetupItem {
  return {
    expert_id: "expert-maria",
    expert_name: "Maria",
    expert_avatar_url: null,
    workflow_id: "wf-1",
    workflow_name: "SEO Audit",
    library_agent_id: "lib-1",
    providers: ["notion"],
    resolution: "connect",
    credential_id: null,
    ...overrides,
  };
}

describe("TeamPage - setup needed card", () => {
  test("stays hidden when nothing needs setup", async () => {
    server.use(getListExpertsMockHandler([hiredMaria]));

    render(<TeamPage />);

    await screen.findByText("Marketing Strategist");
    expect(screen.queryByTestId("setup-needed")).toBeNull();
  });

  test("lists each missing connection with the expert and workflow", async () => {
    server.use(
      getListExpertsMockHandler([hiredMaria]),
      getListExpertSetupItemsMockHandler([
        makeSetupItem(),
        makeSetupItem({
          workflow_id: "wf-2",
          workflow_name: "Weekly digest",
          providers: ["github"],
          resolution: "allow",
          credential_id: "cred-github",
        }),
        makeSetupItem({
          workflow_id: "wf-3",
          workflow_name: "Newsletter",
          providers: [],
          resolution: "workflow",
        }),
      ]),
      getGetV1ListProvidersMockHandler([
        { name: "notion", supported_auth_types: ["api_key"] },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    expect(within(card).getByText("Setup needed (3)")).toBeDefined();
    expect(
      await within(card).findByText("Notion for Marketing Strategist"),
    ).toBeDefined();
    expect(
      within(card).getByText("SEO Audit needs it to run on schedule."),
    ).toBeDefined();
    expect(within(card).getByRole("button", { name: "Connect" })).toBeDefined();
    expect(within(card).getByRole("button", { name: "Allow" })).toBeDefined();
    expect(
      within(card)
        .getByRole("link", { name: "Open workflow" })
        .getAttribute("href"),
    ).toBe("/library/agents/lib-1");
  });

  test("an input only the user can give is named, with the workflow to fill it in", async () => {
    server.use(
      getListExpertSetupItemsMockHandler([
        makeSetupItem({
          workflow_name: "Personal Newsletter",
          providers: [],
          resolution: "inputs",
          missing_inputs: ["Email Address"],
        }),
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    expect(
      within(card).getByText("Schedule Personal Newsletter for AI Expert"),
    ).toBeDefined();
    expect(
      within(card).getByText(
        "Needs Email Address before it can run on schedule.",
      ),
    ).toBeDefined();
    expect(
      within(card)
        .getByRole("link", { name: "Open workflow" })
        .getAttribute("href"),
    ).toBe("/library/agents/lib-1");
  });

  test("a provider the user cannot connect is explained instead of offered", async () => {
    server.use(
      getListExpertSetupItemsMockHandler([
        makeSetupItem({ providers: ["some_platform_only_provider"] }),
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    expect(within(card).getByText("Needs a platform key")).toBeDefined();
    expect(within(card).queryByRole("button", { name: "Connect" })).toBeNull();
  });

  test("offers Connect for a service reached only through its own sign-in", async () => {
    server.use(
      getListExpertSetupItemsMockHandler([
        makeSetupItem({ providers: ["mcp_notion"] }),
      ]),
      getGetV1ListProvidersMockHandler([
        {
          name: "mcp_notion",
          display_name: "Notion",
          supported_auth_types: [],
          mcp_server: {
            server_url: "https://mcp.notion.com/mcp",
            documentation_url: "https://developers.notion.com/guides/mcp",
            setup_instructions: "Sign in to Notion.",
            connection_mode: "hosted",
            auth_methods: ["oauth"],
          },
        },
      ]),
    );
    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    expect(within(card).getByText("Setup needed (1)")).toBeDefined();
    fireEvent.click(
      await within(card).findByRole("button", { name: "Connect" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Sign in to Notion.")).toBeDefined();
    expect(
      within(dialog).queryByRole("button", { name: "Continue" }),
    ).toBeNull();
  });

  test("Allow grants the existing credential to that expert", async () => {
    let granted: {
      expertId: string;
      body: { credential_ids: string[] };
    } | null = null;
    server.use(
      getListExpertSetupItemsMockHandler([
        makeSetupItem({ resolution: "allow", credential_id: "cred-notion" }),
      ]),
      http.post(
        "/api/proxy/api/experts/:expertId/credentials",
        async ({ params, request }) => {
          granted = {
            expertId: String(params.expertId),
            body: (await request.json()) as { credential_ids: string[] },
          };
          return HttpResponse.json([]);
        },
      ),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    fireEvent.click(within(card).getByRole("button", { name: "Allow" }));

    await waitFor(() =>
      expect(granted).toEqual({
        expertId: "expert-maria",
        body: { credential_ids: ["cred-notion"] },
      }),
    );
  });

  test("connecting a service clears its row without a reload", async () => {
    let items = [makeSetupItem()];
    let granted: string[][] = [];
    server.use(
      http.get("/api/proxy/api/experts/setup", () => HttpResponse.json(items)),
      getGetV1ListProvidersMockHandler([
        { name: "notion", supported_auth_types: ["api_key"] },
      ]),
      http.post("/api/proxy/api/integrations/notion/credentials", () =>
        HttpResponse.json(
          {
            id: "cred-notion",
            provider: "notion",
            type: "api_key",
            title: "Team Notion",
          },
          { status: 201 },
        ),
      ),
      http.post(
        "/api/proxy/api/experts/:expertId/credentials",
        async ({ request }) => {
          const body = (await request.json()) as { credential_ids: string[] };
          granted = [...granted, body.credential_ids];
          items = [];
          return HttpResponse.json([]);
        },
      ),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    fireEvent.click(within(card).getByRole("button", { name: "Connect" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      await within(dialog).findByRole("button", { name: /API Key/ }),
    );
    await userEvent.type(
      await within(dialog).findByPlaceholderText("My Notion key"),
      "Team Notion",
    );
    await userEvent.type(
      within(dialog).getByPlaceholderText("sk-..."),
      "secret-value",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Continue" }),
    );

    await waitFor(() => expect(granted).toEqual([["cred-notion"]]));
    await waitFor(() =>
      expect(screen.queryByTestId("setup-needed")).toBeNull(),
    );
  });

  test("signing in with OAuth clears its row without a reload", async () => {
    let items = [makeSetupItem({ providers: ["google"] })];
    let granted: string[][] = [];
    server.use(
      http.get("/api/proxy/api/experts/setup", () => HttpResponse.json(items)),
      getGetV1ListProvidersMockHandler([
        { name: "google", supported_auth_types: ["oauth2"] },
      ]),
      http.get("/api/proxy/api/integrations/google/login", () =>
        HttpResponse.json({
          login_url: "https://accounts.example/auth",
          state_token: "state",
        }),
      ),
      http.post("/api/proxy/api/integrations/google/callback", () =>
        HttpResponse.json({
          id: "cred-google",
          provider: "google",
          type: "oauth2",
          title: "Work Google",
        }),
      ),
      http.post(
        "/api/proxy/api/experts/:expertId/credentials",
        async ({ request }) => {
          const body = (await request.json()) as { credential_ids: string[] };
          granted = [...granted, body.credential_ids];
          items = [];
          return HttpResponse.json([]);
        },
      ),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    fireEvent.click(within(card).getByRole("button", { name: "Connect" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      await within(dialog).findByRole("button", { name: /OAuth/ }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Continue" }),
    );

    await waitFor(() => expect(granted).toEqual([["cred-google"]]));
    await waitFor(() =>
      expect(screen.queryByTestId("setup-needed")).toBeNull(),
    );
  });

  test("Connect opens the connect dialog on that provider", async () => {
    server.use(
      getListExpertSetupItemsMockHandler([makeSetupItem()]),
      getGetV1ListProvidersMockHandler([
        { name: "notion", supported_auth_types: ["api_key"] },
      ]),
    );

    render(<TeamPage />);

    const card = await screen.findByTestId("setup-needed");
    fireEvent.click(within(card).getByRole("button", { name: "Connect" }));

    const dialog = await screen.findByRole("dialog");
    // Straight to the provider's step: the picker gives way to it once the
    // provider list has loaded, so wait for the picker heading to go.
    await waitFor(() =>
      expect(
        within(dialog).queryByText("Connect a service for Maria"),
      ).toBeNull(),
    );
    expect(within(dialog).getByRole("button", { name: "Back" })).toBeDefined();
    expect(within(dialog).getAllByText(/Notion/).length).toBeGreaterThan(0);
  });

  test("follows a fresh hire's setup until its skills land", async () => {
    let reads = 0;
    server.use(
      getListExpertsMockHandler(() => {
        reads += 1;
        return reads === 1
          ? [{ ...hiredMaria, setup_status: "installing", skills: [] }]
          : [{ ...hiredMaria, setup_status: "ready", skills: ["a", "b"] }];
      }),
    );

    render(<TeamPage />);

    expect(
      await screen.findByText(
        "Setting up Marketing Strategist's skills and workflows…",
      ),
    ).toBeDefined();
    const card = screen.getByRole("link", {
      name: "View Marketing Strategist",
    });
    await waitFor(() => expect(getStatValue(card, "Skills")).toBe("2"), {
      timeout: 5_000,
    });
    expect(
      screen.queryByText(
        "Setting up Marketing Strategist's skills and workflows…",
      ),
    ).toBeNull();
  });

  test("a failed setup offers a retry that re-hires the template", async () => {
    const hires: unknown[] = [];
    server.use(
      getListExpertsMockHandler([
        {
          ...hiredMaria,
          source_template_id: "template-maria",
          setup_status: "failed",
          setup_failures: ["SEO Audit"],
        },
      ]),
      http.post("/api/proxy/api/experts", async ({ request }) => {
        hires.push(await request.json());
        return HttpResponse.json({ expert: hiredMaria });
      }),
    );

    render(<TeamPage />);

    expect(
      await screen.findByText("Couldn't install: SEO Audit"),
    ).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Retry setup" }));
    await waitFor(() =>
      expect(hires).toEqual([{ template_id: "template-maria" }]),
    );
  });

  test("a failed setup with no template offers no retry", async () => {
    server.use(
      getListExpertsMockHandler([
        {
          ...hiredMaria,
          source_template_id: null,
          setup_status: "failed",
          setup_failures: ["SEO Audit"],
        },
      ]),
    );

    render(<TeamPage />);

    expect(
      await screen.findByText("Couldn't install: SEO Audit"),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "Retry setup" })).toBeNull();
  });
});
