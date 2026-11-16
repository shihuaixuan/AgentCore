import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/tests/integrations/test-utils";
import { server } from "@/mocks/mock-server";
import { http, HttpResponse } from "msw";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  withServerActionInstrumentation: (...args: unknown[]) =>
    (args.at(-1) as () => unknown)(),
}));

vi.mock("@/components/contextual/CronScheduler/cron-scheduler-dialog", () => ({
  CronExpressionDialog: () => null,
}));

vi.mock("./components/ThumbnailImages", () => ({
  ThumbnailImages: () => <div data-testid="thumbnail-images-mock" />,
}));

import { AgentInfoStep } from "../AgentInfoStep";

function LocalizedListing() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <AgentInfoStep
        onBack={() => {}}
        onSuccess={() => {}}
        selectedAgentId="graph-1"
        selectedAgentVersion={1}
      />
    </>
  );
}

it("opens the slug help in Chinese and switches the same help to English", async () => {
  render(
    <LanguageProvider>
      <LocalizedListing />
    </LanguageProvider>,
  );
  const slug = await screen.findByLabelText("网址标识");
  const label = document.querySelector(`label[for="${slug.id}"]`);
  const trigger = label?.parentElement?.querySelector("button");
  expect(trigger).toBeDefined();
  fireEvent.focus(trigger!);
  expect(
    await screen.findByText(
      "用于市场网址路径的标识，只能包含小写字母、数字和连字符。",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    await screen.findByText(
      "URL-friendly identifier used in the marketplace path. Lowercase letters, numbers, hyphens only.",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Experience details" }));
  await screen.findByLabelText("YouTube video link");
  expect(
    screen.getAllByPlaceholderText("https://youtube.com/watch?v=...").length,
  ).toBe(2);
});

describe("AgentInfoStep", () => {
  const baseProps = {
    onBack: vi.fn(),
    onSuccess: vi.fn(),
    selectedAgentId: "graph-1",
    selectedAgentVersion: 1,
    initialData: undefined,
    isMarketplaceUpdate: false,
  };

  it("renders the listing form with the three accordion sections", async () => {
    render(<AgentInfoStep {...baseProps} />);

    expect(await screen.findByText("Build the store listing")).toBeDefined();
    expect(screen.getByText("Listing basics")).toBeDefined();
    expect(screen.getByText("Thumbnails")).toBeDefined();
    expect(screen.getByText("Experience details")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /submit for review/i }),
    ).toBeDefined();
  });

  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    render(<AgentInfoStep {...baseProps} onBack={onBack} />);
    await screen.findByText("Build the store listing");
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders the marketplace-update copy when isMarketplaceUpdate is true", async () => {
    render(<AgentInfoStep {...baseProps} isMarketplaceUpdate />);
    expect(await screen.findByText("Describe the update")).toBeDefined();
  });

  it("disables the category field when the category list cannot be loaded", async () => {
    server.use(
      http.get("http://localhost:3000/api/proxy/api/store/categories", () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
    );
    render(<AgentInfoStep {...baseProps} />);

    // The field is disabled while loading too, so wait for the copy that only
    // the error state renders before asserting on it. The accordion holding it
    // opens on a timer after mount.
    expect(await screen.findByText("Categories unavailable")).toBeDefined();

    const category = screen.getByRole("combobox", { name: /category/i });
    expect(category.hasAttribute("disabled")).toBe(true);
  });

  it("mounts cleanly when the submissions API would error (handler installed)", async () => {
    server.use(
      http.post("http://localhost:3000/api/proxy/api/store/submissions", () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
    );
    render(<AgentInfoStep {...baseProps} />);
    expect(await screen.findByText("Build the store listing")).toBeDefined();
  });
});
