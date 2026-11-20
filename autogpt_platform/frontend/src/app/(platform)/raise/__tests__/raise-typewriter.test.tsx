import { Toaster } from "@/components/molecules/Toast/toaster";
import { render, screen } from "@/tests/integrations/test-utils";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { EMPTY_DRAFT } from "../helpers";
import RaisePage from "../page";

vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: true, user: { id: "user-1" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/raise",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

function renderRaise() {
  return render(
    <>
      <RaisePage />
      <Toaster />
    </>,
  );
}

function visibleBubbleText() {
  const log = screen.getByRole("log", { name: "Expert creation conversation" });
  return Array.from(log.querySelectorAll("span[aria-hidden]")).map(
    (node) => node.textContent ?? "",
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

test("instantly restores the conversation at the avatar instead of the old name question", async () => {
  window.sessionStorage.setItem(
    "raise-expert-draft",
    JSON.stringify({
      ...EMPTY_DRAFT,
      step: "name",
      hasStarted: true,
      category: "marketing",
      color: "rose-300",
      jobTitle: "Marketing Manager",
      name: "Retired Nova",
    }),
  );

  renderRaise();

  expect(
    await screen.findByRole(
      "log",
      { name: "Expert creation conversation" },
      { timeout: 5000 },
    ),
  ).toBeDefined();

  const visible = visibleBubbleText();
  expect(
    visible.some((text) =>
      text.includes(
        "Hello, I'm your General Office Assistant. I'll help you create your own AI Expert.",
      ),
    ),
  ).toBe(true);
  expect(
    visible.some((text) =>
      text.includes("First — which area should your expert work in?"),
    ),
  ).toBe(true);
  expect(
    visible.some((text) =>
      text.includes("Here's an avatar for Marketing Manager."),
    ),
  ).toBe(true);
  expect(
    visible.some((text) => text.includes("And what's their job title?")),
  ).toBe(true);
  expect(visible.join(" ")).not.toContain("What do you want to call them?");
  expect(visible.join(" ")).not.toContain("Retired Nova");
});
