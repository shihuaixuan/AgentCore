import { getListExpertsMockHandler } from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { getGetV2ListStoreCategoriesMockHandler } from "@/app/api/__generated__/endpoints/store/store.msw";
import { Expert } from "@/app/api/__generated__/models/expert";
import { server } from "@/mocks/mock-server";
import {
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MainMarkeplacePage } from "../components/MainMarketplacePage/MainMarketplacePage";

configure({ asyncUtilTimeout: 10000 });

const mockUseAuth = vi.hoisted(() => vi.fn());
const route = vi.hoisted(() => ({ search: "", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: route.push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/marketplace",
  useSearchParams: () => new URLSearchParams(route.search),
  useParams: () => ({}),
}));

vi.mock("@/lib/auth/hooks/useAuth", () => ({ useAuth: mockUseAuth }));

const CATEGORIES = [
  { value: "marketing", label: "Marketing", description: "Campaigns and SEO" },
  { value: "sales", label: "Sales", description: "Leads and outreach" },
];

function template(name: string, categories: string[]): Expert {
  return {
    id: `template-${name.toLowerCase()}`,
    name,
    avatar_url: null,
    role: categories[0],
    job_title: name === "Maria" ? "SEO Content Manager" : "Account Executive",
    bio: null,
    skills: [],
    categories,
    tagline: `${name} works here`,
    identity: `You are ${name}.`,
    voice_preferences: "Direct.",
    boundaries: "Ask first.",
    protected_soul_rules: [],
    is_template: true,
    source_template_id: null,
    is_archived: false,
    workflows: [],
  };
}

const ROSTER = [template("Maria", ["marketing"]), template("Max", ["sales"])];

/** Records every ?category= the roster is asked for, and answers with the
 *  experts filed under it — the server-side filter, as the page sees it. */
const requestedCategories: (string | null)[] = [];

describe("Marketplace category filter over experts", () => {
  beforeEach(() => {
    requestedCategories.length = 0;
    route.search = "";
    route.push.mockReset().mockImplementation((href: string) => {
      route.search = new URL(href, "https://example.test").search;
    });

    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoggedIn: true });
    server.use(
      getListExpertsMockHandler([]),
      getGetV2ListStoreCategoriesMockHandler(CATEGORIES),
      http.get("/api/proxy/api/experts/templates", ({ request }) => {
        const category = new URL(request.url).searchParams.get("category");
        requestedCategories.push(category);
        return HttpResponse.json(
          category
            ? ROSTER.filter((t) => t.categories?.includes(category))
            : ROSTER,
        );
      }),
      http.get("/api/proxy/api/store/agents", () =>
        HttpResponse.json({
          agents: [],
          pagination: {
            current_page: 1,
            total_items: 0,
            total_pages: 0,
            page_size: 20,
          },
        }),
      ),
      http.get("/api/proxy/api/store/creators", () =>
        HttpResponse.json({
          creators: [],
          pagination: {
            current_page: 1,
            total_items: 0,
            total_pages: 0,
            page_size: 20,
          },
        }),
      ),
    );
  });

  test("a multi-category card keeps its own identity under every filter", async () => {
    const expert = template("Quinn", ["research", "finance"]);
    expert.avatar_url = "/experts/clay/v3/quinn.png";
    server.use(
      getGetV2ListStoreCategoriesMockHandler([
        { value: "research", label: "Research", description: "Research" },
        { value: "finance", label: "Finance", description: "Finance" },
      ]),
      http.get("/api/proxy/api/experts/templates", () =>
        HttpResponse.json([expert]),
      ),
    );
    const { rerender } = render(<MainMarkeplacePage />);
    const finance = await findCategoryChip("Finance");
    const card = await within(await screen.findByRole("article")).findByRole(
      "link",
      { name: /^Account Executive\b/ },
    );
    expect(card.getAttribute("href")).toBe(
      "/marketplace/experts/template-quinn",
    );
    const image = card.querySelector("img")?.getAttribute("src");
    expect(image).toContain("expert-quinn");
    await userEvent.click(finance);
    rerender(<MainMarkeplacePage />);
    expect(finance.getAttribute("aria-pressed")).toBe("true");
    const filteredCard = await screen.findByRole("article");
    expect(within(filteredCard).getByText("Finance")).toBeDefined();
    expect(filteredCard.querySelector("img")?.getAttribute("src")).toBe(image);
    await userEvent.click(await findCategoryChip("All"));
    rerender(<MainMarkeplacePage />);
    const resetCard = await screen.findByRole("article");
    expect(within(resetCard).getByText("Research")).toBeDefined();
    expect(resetCard.querySelector("img")?.getAttribute("src")).toBe(image);
  });

  test("the chip row sits above the experts shelf it narrows", async () => {
    render(<MainMarkeplacePage />);

    const chips = await screen.findByRole("group", {
      name: "Browse experts by category",
    });
    const shelf = (await screen.findAllByRole("article"))[0];

    // Node.DOCUMENT_POSITION_FOLLOWING: the shelf comes after the chips.
    expect(chips.compareDocumentPosition(shelf) & 4).toBeTruthy();
  });

  test("picking a category narrows the roster and drops the others", async () => {
    const { rerender } = render(<MainMarkeplacePage />);

    expect(
      await screen.findByRole("heading", { name: "SEO Content Manager" }),
    ).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: "Account Executive" }),
    ).toBeDefined();

    await userEvent.click(await findCategoryChip("Marketing"));
    rerender(<MainMarkeplacePage />);

    await waitFor(() => expect(requestedCategories).toContain("marketing"));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Account Executive" }),
      ).toBeNull(),
    );
    expect(
      await screen.findByRole("heading", { name: "SEO Content Manager" }),
    ).toBeDefined();
  });

  test("clearing the category restores the whole roster", async () => {
    const { rerender } = render(<MainMarkeplacePage />);
    await screen.findByRole("heading", { name: "Account Executive" });

    await userEvent.click(await findCategoryChip("Marketing"));
    rerender(<MainMarkeplacePage />);
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Account Executive" }),
      ).toBeNull(),
    );

    await userEvent.click(await findCategoryChip("Marketing"));
    rerender(<MainMarkeplacePage />);

    expect(
      await screen.findByRole("heading", { name: "Account Executive" }),
    ).toBeDefined();
  });

  test("a category with no experts offers to clear the filters", async () => {
    server.use(
      http.get("/api/proxy/api/experts/templates", ({ request }) => {
        const category = new URL(request.url).searchParams.get("category");
        return HttpResponse.json(category ? [] : ROSTER);
      }),
    );
    const { rerender } = render(<MainMarkeplacePage />);
    await screen.findByRole("heading", { name: "SEO Content Manager" });

    await userEvent.click(await findCategoryChip("Sales"));
    rerender(<MainMarkeplacePage />);
    expect(
      await screen.findByRole("button", { name: "Clear filters" }),
    ).toBeDefined();
  });

  test("a failed roster request under a category still offers the raise link", async () => {
    server.use(
      http.get("/api/proxy/api/experts/templates", ({ request }) => {
        const category = new URL(request.url).searchParams.get("category");
        // Unfiltered succeeds so the page renders; the filtered fetch fails.
        return category
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(ROSTER);
      }),
    );
    const { rerender } = render(<MainMarkeplacePage />);
    await screen.findByRole("heading", { name: "SEO Content Manager" });

    await userEvent.click(await findCategoryChip("Sales"));
    rerender(<MainMarkeplacePage />);
    await screen.findByRole("button", { name: "Try Again" });
    expect(
      screen
        .getByRole("link", { name: "Create an Expert" })
        .getAttribute("href"),
    ).toBe("/raise");
  });
});

async function findCategoryChip(name: string) {
  const group = await screen.findByRole("group", {
    name: "Browse experts by category",
  });
  return within(group).findByRole("button", { name });
}
