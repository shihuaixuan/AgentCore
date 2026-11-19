import { getCreateRaisedExpertMockHandler } from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { getListCopilotSkillsMockHandler } from "@/app/api/__generated__/endpoints/skills/skills.msw";
import { getGetV2ListMarketplaceSkillsMockHandler200 } from "@/app/api/__generated__/endpoints/store/store.msw";
import type { Expert } from "@/app/api/__generated__/models/expert";
import type { MarketplaceSkill } from "@/app/api/__generated__/models/marketplaceSkill";
import type { RaiseResult } from "@/app/api/__generated__/models/raiseResult";
import { Toaster } from "@/components/molecules/Toast/toaster";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { render, screen, waitFor } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import RaisePage from "../page";
import {
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  VOICE_SKIPPED_LABEL,
} from "../helpers";

vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: true, user: { id: "user-1" } }),
}));

const { pushMock, notFoundMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

const { invalidateRosterMock } = vi.hoisted(() => ({
  invalidateRosterMock: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/services/experts/invalidate-experts", () => ({
  invalidateExpertRosterQueries: invalidateRosterMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => "/raise",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    notFoundMock();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const raisedExpert = {
  id: "raised-1",
  name: "Marketing Manager",
  avatar_url: null,
  role: "Marketer",
  tagline: null,
  bio: null,
  skills: [],
  identity:
    "I'm Marketing Manager, an AI Expert created by you. I use your instructions to help with your work.",
  voice_preferences: "",
  boundaries: "",
  protected_soul_rules: [],
  is_template: false,
  source_template_id: null,
  is_archived: false,
  workflows: [],
} as Expert;

const LIBRARY_SKILL = { name: "seo-audit", description: "Audit landing pages" };

function hubSkills(skills: MarketplaceSkill[]) {
  return getGetV2ListMarketplaceSkillsMockHandler200({
    skills,
    pagination: {
      total_items: skills.length,
      total_pages: 1,
      current_page: 1,
      page_size: 3,
    },
  });
}

function raiseResult(overrides: Partial<RaiseResult> = {}): RaiseResult {
  return { expert: raisedExpert, failed_attachments: [], ...overrides };
}

function renderRaise() {
  return render(
    <>
      <RaisePage />
      <Toaster />
    </>,
  );
}

function mockReducedMotion() {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    return {
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
}

function seedAtBudget() {
  saveDraft({
    step: "budget",
    hasStarted: true,
    category: "marketing",
    color: "rose-300",
    jobTitle: "Marketing Manager",
    avatarUrl: "",
    about: "",
    voicePreferences: "",
    voiceLabel: VOICE_SKIPPED_LABEL,
    budget: null,
    marketplace: null,
    skills: null,
  });
}

function seedAtSkills(budget: { credits: number | null } = { credits: null }) {
  saveDraft({
    step: "skills",
    hasStarted: true,
    category: "marketing",
    color: "rose-300",
    jobTitle: "Marketing Manager",
    avatarUrl: "",
    about: "",
    voicePreferences: "",
    voiceLabel: VOICE_SKIPPED_LABEL,
    budget,
    marketplace: [],
    skills: null,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
  mockReducedMotion();

  pushMock.mockClear();
  notFoundMock.mockClear();
  // One library skill is enough to keep the skills beat in the flow; with
  // none and an empty Hub, the marketplace beat becomes the last one.
  server.use(getListCopilotSkillsMockHandler([LIBRARY_SKILL]), hubSkills([]));
});

afterEach(() => {
  vi.clearAllMocks();
});

test.each([null, "finance"])(
  "preserves a legacy custom role on submission with stored category %s",
  async (category) => {
    let captured: unknown = null;
    server.use(
      getCreateRaisedExpertMockHandler(async (info) => {
        captured = await info.request.json();
        return raiseResult();
      }),
    );
    seedAtSkills();
    window.sessionStorage.setItem(
      "raise-expert-draft",
      JSON.stringify({
        ...loadDraft(),
        category,
        role: "Invoice chaser",
        jobTitle: "Accounts Receivable Specialist",
      }),
    );
    renderRaise();

    await userEvent.click(
      await screen.findByRole("button", { name: "Skip" }, { timeout: 5000 }),
    );

    await waitFor(() =>
      expect(captured).toMatchObject({
        name: "Accounts Receivable Specialist",
        role: "Invoice chaser",
        job_title: "Accounts Receivable Specialist",
      }),
    );
  },
);

test("opens expert creation without a rollout flag", async () => {
  renderRaise();
  expect(
    await screen.findByRole("button", { name: "Create Expert" }),
  ).toBeDefined();
  expect(notFoundMock).not.toHaveBeenCalled();
});

test("skips remaining kit steps, posts null budget and empty attachments, and opens copilot", async () => {
  let captured: unknown = null;
  server.use(
    getCreateRaisedExpertMockHandler(async (info) => {
      captured = await info.request.json();
      return raiseResult();
    }),
  );

  seedAtSkills();
  renderRaise();
  // The skills step only renders its actions once the copilot-skills request
  // settles, which can outrun the 1s default when the suite runs under load.
  await userEvent.click(
    await screen.findByRole("button", { name: "Skip" }, { timeout: 5000 }),
  );

  await waitFor(() => expect(captured).not.toBeNull());
  expect(captured).toMatchObject({
    name: "Marketing Manager",
    role: "Marketer",
    job_title: "Marketing Manager",
    weekly_budget: null,
    attachments: [],
  });
  await waitFor(() =>
    expect(pushMock).toHaveBeenCalledWith(
      "/copilot?expertId=raised-1&kickoff=1",
    ),
  );
});

test("refreshes the expert roster before opening the kickoff thread", async () => {
  server.use(getCreateRaisedExpertMockHandler(raiseResult()));
  seedAtSkills();
  renderRaise();

  await userEvent.click(
    await screen.findByRole("button", { name: "Skip" }, { timeout: 5000 }),
  );

  await waitFor(() =>
    expect(pushMock).toHaveBeenCalledWith(
      "/copilot?expertId=raised-1&kickoff=1",
    ),
  );
  expect(invalidateRosterMock).toHaveBeenCalledTimes(1);
  expect(invalidateRosterMock.mock.invocationCallOrder[0]).toBeLessThan(
    pushMock.mock.invocationCallOrder[0],
  );
});

test("localizes a skipped title's category role without translating the API name", async () => {
  let captured: unknown = null;
  server.use(
    getCreateRaisedExpertMockHandler(async (info) => {
      captured = await info.request.json();
      return raiseResult();
    }),
  );

  seedAtSkills();
  saveDraft({ ...loadDraft(), jobTitle: "" });
  render(
    <LanguageProvider initialLocale="zh-CN">
      <RaisePage />
    </LanguageProvider>,
  );
  expect(
    await screen.findByRole("heading", { name: "营销专员", level: 2 }),
  ).toBeDefined();
  await userEvent.click(
    await screen.findByRole("button", { name: "创建 营销专员" }),
  );

  await waitFor(() =>
    expect(captured).toMatchObject({
      name: "Marketer",
      role: "Marketer",
      job_title: null,
    }),
  );
});

test("posts a chosen weekly budget", async () => {
  let captured: unknown = null;
  server.use(
    getCreateRaisedExpertMockHandler(async (info) => {
      captured = await info.request.json();
      return raiseResult();
    }),
  );

  seedAtSkills({ credits: 500 });
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Bring Marketing Manager to life",
    }),
  );

  await waitFor(() => expect(captured).not.toBeNull());
  expect(captured).toMatchObject({
    name: "Marketing Manager",
    weekly_budget: 500,
    attachments: [],
  });
  await waitFor(() =>
    expect(pushMock).toHaveBeenCalledWith(
      "/copilot?expertId=raised-1&kickoff=1",
    ),
  );
});

test("a rapid double-click on finish sends a single POST", async () => {
  let postCount = 0;
  server.use(
    getCreateRaisedExpertMockHandler(() => {
      postCount += 1;
      return raiseResult();
    }),
  );

  seedAtSkills();
  renderRaise();
  const finishButton = await screen.findByRole("button", { name: /life/ });
  await Promise.all([
    userEvent.click(finishButton),
    userEvent.click(finishButton),
  ]);

  await waitFor(() => expect(pushMock).toHaveBeenCalled());
  expect(postCount).toBe(1);
});

test("unlocks finish after a raise POST fails so the user can retry", async () => {
  let postCount = 0;
  server.use(
    http.post("/api/proxy/api/experts/raise", () => {
      postCount += 1;
      return HttpResponse.json({ detail: "Raise failed" }, { status: 500 });
    }),
  );

  seedAtSkills();
  renderRaise();
  await userEvent.click(await screen.findByRole("button", { name: /life/ }));
  expect(
    await screen.findByText("Couldn't create Marketing Manager"),
  ).toBeDefined();
  await waitFor(() => expect(postCount).toBe(1));

  const retry = screen.getByRole("button", {
    name: "Bring Marketing Manager to life",
  });
  expect((retry as HTMLButtonElement).disabled).toBe(false);
  await userEvent.click(retry);
  await waitFor(() => expect(postCount).toBe(2));
});

test("shows a friendly limit message on 409", async () => {
  server.use(
    http.post("/api/proxy/api/experts/raise", () =>
      HttpResponse.json(
        { detail: { code: "active_expert_limit", limit: 20 } },
        { status: 409 },
      ),
    ),
  );

  seedAtSkills();
  renderRaise();
  await userEvent.click(await screen.findByRole("button", { name: /life/ }));

  expect(await screen.findByText("Your team is full")).toBeDefined();
  expect(pushMock).not.toHaveBeenCalled();
});

test("distinguishes the lifetime limit for created Experts", async () => {
  server.use(
    http.post("/api/proxy/api/experts/raise", () =>
      HttpResponse.json(
        { detail: { code: "raised_expert_lifetime_limit", limit: 100 } },
        { status: 409 },
      ),
    ),
  );

  seedAtSkills();
  renderRaise();
  await userEvent.click(await screen.findByRole("button", { name: /life/ }));

  expect(
    await screen.findByText("Expert creation limit reached"),
  ).toBeDefined();
  expect(screen.getByText(/Contact support/)).toBeDefined();
  expect(pushMock).not.toHaveBeenCalled();
});

test("toasts failed attachments and still opens copilot", async () => {
  server.use(
    getCreateRaisedExpertMockHandler(
      raiseResult({
        failed_attachments: [
          {
            kind: "workflow",
            source: "marketplace",
            id: "listing-1",
            reason: "installation_failed",
          },
        ],
      }),
    ),
  );

  seedAtSkills();
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Bring Marketing Manager to life",
    }),
  );

  expect(
    await screen.findByText(
      "Created Marketing Manager, but some tools didn't attach",
    ),
  ).toBeDefined();
  await waitFor(() =>
    expect(pushMock).toHaveBeenCalledWith(
      "/copilot?expertId=raised-1&kickoff=1",
    ),
  );
});

test.each([
  {
    answer: "Marketing Manager",
    jobTitle: "Marketing Manager",
    title: "Marketing Manager",
  },
  { answer: "Skip", jobTitle: "", title: "Marketer" },
])(
  "goes straight to the avatar as $title after choosing $answer",
  async ({ answer, jobTitle, title }) => {
    saveDraft({
      ...EMPTY_DRAFT,
      hasStarted: true,
      category: "marketing",
      color: "rose-300",
      step: "jobTitle",
    });
    renderRaise();
    await userEvent.click(await screen.findByRole("button", { name: answer }));

    expect(loadDraft()).toMatchObject({ jobTitle, step: "avatar" });
    expect(
      await screen.findByRole("button", { name: "Use this avatar" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: title, level: 2 }),
    ).toBeDefined();
    expect(screen.queryByRole("group", { name: "Suggested names" })).toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Or type your own" }),
    ).toBeNull();
    expect(
      screen.queryByText("Good pick. What do you want to call them?"),
    ).toBeNull();
  },
);

test("typing a job title trims it and continues to the avatar", async () => {
  saveDraft({
    ...EMPTY_DRAFT,
    hasStarted: true,
    category: "research",
    color: "lime-300",
    step: "jobTitle",
  });
  renderRaise();
  await userEvent.type(
    await screen.findByRole("textbox", { name: "Job title" }),
    "  Chief of Staff  ",
  );
  await userEvent.click(screen.getByRole("button", { name: "Add title" }));

  expect(loadDraft()).toMatchObject({
    jobTitle: "Chief of Staff",
    step: "avatar",
  });
  expect(
    await screen.findByRole("button", { name: "Use this avatar" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "Chief of Staff", level: 2 }),
  ).toBeDefined();
});

test("resumes a legacy draft at skills and submits the profession without the old name", async () => {
  const attachment = {
    kind: "workflow",
    source: "marketplace",
    id: "listing-1",
    name: "SEO Blog Writer",
  };
  window.sessionStorage.setItem(
    "raise-expert-draft",
    JSON.stringify({
      ...EMPTY_DRAFT,
      step: "skills",
      hasStarted: true,
      category: "marketing",
      jobTitle: "  Marketing Manager  ",
      name: "Retired Nova",
      color: "rose-300",
      avatarUrl: "/saved-avatar.png",
      about: "Audit my landing pages.",
      voicePreferences: "Be concise.",
      voiceLabel: "Concise and direct",
      budget: { credits: 500 },
      marketplace: [attachment],
    }),
  );
  let captured: unknown;
  server.use(
    getCreateRaisedExpertMockHandler(async ({ request }) => {
      captured = await request.json();
      return raiseResult();
    }),
  );

  renderRaise();
  const finish = await screen.findByRole("button", {
    name: "Bring Marketing Manager to life",
  });
  expect(
    screen.getByRole("heading", { name: "Marketing Manager", level: 2 }),
  ).toBeDefined();
  expect(
    screen.getByRole("img", { name: "Marketing Manager's picture" }),
  ).toBeDefined();
  expect(screen.queryByText(/Retired Nova/)).toBeNull();
  await userEvent.click(finish);

  await waitFor(() =>
    expect(captured).toMatchObject({
      name: "Marketing Manager",
      role: "Marketer",
      job_title: "Marketing Manager",
      color: "rose-300",
      avatar_url: "/saved-avatar.png",
      about: "Audit my landing pages.",
      voice_preferences: "Be concise.",
      weekly_budget: 500,
      attachments: [
        { kind: "workflow", source: "marketplace", id: "listing-1" },
      ],
    }),
  );
});

test("picking a weekly budget advances to marketplace workflows", async () => {
  seedAtBudget();
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", { name: "$5 / week" }),
  );

  expect(
    await screen.findByRole(
      "textbox",
      { name: "Search marketplace and library workflows" },
      { timeout: 3000 },
    ),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "That's it" })).toBeDefined();
});

test("drops the skills beat and raises from the marketplace step when there is nothing to add", async () => {
  let captured: unknown = null;
  server.use(
    getListCopilotSkillsMockHandler([]),
    getCreateRaisedExpertMockHandler(async (info) => {
      captured = await info.request.json();
      return raiseResult();
    }),
  );

  seedAtBudget();
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", { name: "$5 / week" }),
  );

  const finish = await screen.findByRole(
    "button",
    { name: "Bring Marketing Manager to life" },
    { timeout: 5000 },
  );
  expect(screen.queryByRole("textbox", { name: "Search skills" })).toBeNull();
  await userEvent.click(finish);

  await waitFor(() => expect(captured).not.toBeNull());
  expect(captured).toMatchObject({ weekly_budget: 500, attachments: [] });
  await waitFor(() =>
    expect(pushMock).toHaveBeenCalledWith(
      "/copilot?expertId=raised-1&kickoff=1",
    ),
  );
});

test("keeps the skills beat when only the Hub has something to offer", async () => {
  server.use(
    getListCopilotSkillsMockHandler([]),
    hubSkills([
      {
        slug: "cold-outreach",
        name: "cold-outreach",
        title: "Cold Outreach",
        description: "Write cold emails",
        categories: ["sales"],
        required_providers: [],
        install_count: 2,
      },
    ]),
  );

  seedAtBudget();
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", { name: "$5 / week" }),
  );

  expect(
    await screen.findByRole("button", { name: "That's it" }, { timeout: 5000 }),
  ).toBeDefined();
  expect(
    screen.queryByRole("button", { name: "Bring Marketing Manager to life" }),
  ).toBeNull();
});

test("keeps the skills beat when availability settles empty after marketplace submit", async () => {
  let captured: unknown = null;
  let settleLibrary!: (skills: (typeof LIBRARY_SKILL)[]) => void;
  const pendingLibrary = new Promise<(typeof LIBRARY_SKILL)[]>((resolve) => {
    settleLibrary = resolve;
  });
  server.use(
    getListCopilotSkillsMockHandler(() => pendingLibrary),
    getCreateRaisedExpertMockHandler(async (info) => {
      captured = await info.request.json();
      return raiseResult();
    }),
  );

  seedAtBudget();
  renderRaise();
  await userEvent.click(
    await screen.findByRole("button", { name: "$5 / week" }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "That's it" }),
  );
  settleLibrary([]);

  await userEvent.click(
    await screen.findByRole(
      "button",
      { name: "Bring Marketing Manager to life" },
      { timeout: 5000 },
    ),
  );

  await waitFor(() => expect(captured).not.toBeNull());
  expect(captured).toMatchObject({ weekly_budget: 500, attachments: [] });
});

test("back returns to the previous step and the draft survives", async () => {
  seedAtBudget();
  renderRaise();
  expect(await screen.findByRole("button", { name: "Skip" })).toBeDefined();

  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    await screen.findByRole("button", { name: "Skip for now" }),
  ).toBeDefined();

  const draft = loadDraft();
  expect(draft.step).toBe("voice");
  expect(draft.voiceLabel).toBeNull();
  expect(draft).toMatchObject({
    hasStarted: true,
    category: "marketing",
    jobTitle: "Marketing Manager",
    color: "rose-300",
  });
});

test("a refresh resumes the draft from session storage", async () => {
  seedAtSkills();
  const first = renderRaise();
  expect(
    await screen.findByRole("button", {
      name: "Bring Marketing Manager to life",
    }),
  ).toBeDefined();

  first.unmount();
  renderRaise();

  expect(
    await screen.findByRole("button", {
      name: "Bring Marketing Manager to life",
    }),
  ).toBeDefined();
});

test.each([400, 422, 503])(
  "keeps the draft and displays the recovery message when creation fails (%s)",
  async (status) => {
    server.use(
      http.post("*/api/experts/raise", () =>
        HttpResponse.json(
          {
            detail:
              "Upload this image again through the appearance picker so it can be reviewed.",
          },
          { status },
        ),
      ),
    );
    seedAtSkills();
    const draft = loadDraft();
    renderRaise();
    const finish = await screen.findByRole("button", {
      name: "Bring Marketing Manager to life",
    });
    await userEvent.click(finish);
    expect(
      await screen.findByText(
        "Upload this image again through the appearance picker so it can be reviewed.",
      ),
    ).toBeDefined();
    expect(loadDraft()).toEqual(draft);
    expect(pushMock).not.toHaveBeenCalled();
    expect(finish.hasAttribute("disabled")).toBe(false);
  },
);
