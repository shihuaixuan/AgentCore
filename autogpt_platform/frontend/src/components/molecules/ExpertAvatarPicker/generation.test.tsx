import { server } from "@/mocks/mock-server";
import { render, screen, waitFor } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { ExpertAvatarPicker } from "./ExpertAvatarPicker";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

// The hook polls on a real 2s interval, so the default 5s budget is not enough
// on a loaded CI runner.
const POLLING_TEST_TIMEOUT = 20000;

test("explains an unconfigured image provider without selecting an avatar", async () => {
  server.use(
    http.post("*/api/experts/avatars/generations", () =>
      HttpResponse.json(
        {
          detail: {
            code: "avatar_provider_not_configured",
            message: "Image generation is not configured.",
          },
        },
        { status: 503 },
      ),
    ),
  );
  const onPick = vi.fn();
  render(
    <LanguageProvider>
      <ExpertAvatarPicker name="Nova" category="finance" onPick={onPick} />
    </LanguageProvider>,
  );
  const before = screen.getByRole("img").getAttribute("src");
  await userEvent.click(screen.getByRole("button", { name: "重新生成" }));
  expect((await screen.findByRole("alert")).textContent).toContain("未配置");
  expect(screen.getByRole("img").getAttribute("src")).toBe(before);
  expect(onPick).not.toHaveBeenCalled();
});

test("can retry a malformed start response and show only the new image", async () => {
  let attempts = 0;
  server.use(
    http.post("*/api/experts/avatars/generations", () =>
      HttpResponse.json(++attempts === 1 ? {} : { id: "retry" }, {
        status: 202,
      }),
    ),
    http.get("*/api/experts/avatars/generations/retry", () =>
      HttpResponse.json({
        status: "complete",
        avatar_url: "https://cdn.test/retry.png",
      }),
    ),
  );
  const onPick = vi.fn();
  render(<ExpertAvatarPicker name="Nova" category="finance" onPick={onPick} />);
  const button = screen.getByRole("button", { name: "Regenerate" });
  await userEvent.click(button);
  await screen.findByRole("alert");
  await userEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toContain("retry.png"),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(onPick).not.toHaveBeenCalled();
});

test("a completed job without an image is a failure, not a generated preview", async () => {
  server.use(
    http.post("*/api/experts/avatars/generations", () =>
      HttpResponse.json({ id: "empty" }, { status: 202 }),
    ),
    http.get("*/api/experts/avatars/generations/empty", () =>
      HttpResponse.json({ id: "empty", status: "complete", avatar_url: " " }),
    ),
  );
  const onPick = vi.fn();
  render(<ExpertAvatarPicker name="Nova" category="finance" onPick={onPick} />);
  const before = screen.getByRole("img").getAttribute("src");
  await userEvent.click(screen.getByRole("button", { name: "Regenerate" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("img").getAttribute("src")).toBe(before);
  expect(onPick).not.toHaveBeenCalled();
});

test(
  "polls a pending job until the preview is ready",
  async () => {
    let polls = 0;
    server.use(
      http.post("*/api/experts/avatars/generations", () =>
        HttpResponse.json(
          { id: "poll-job", status: "pending" },
          { status: 202 },
        ),
      ),
      http.get("*/api/experts/avatars/generations/poll-job", () => {
        polls += 1;
        return HttpResponse.json(
          polls === 1
            ? { id: "poll-job", status: "pending" }
            : {
                id: "poll-job",
                status: "complete",
                avatar_url: "https://cdn.test/sculpted.png",
              },
        );
      }),
    );
    render(
      <ExpertAvatarPicker
        name="Nova"
        category="development"
        onPick={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    await waitFor(() => expect(polls).toBe(1));
    expect(screen.queryByRole("status")).not.toBeNull();
    await waitFor(
      () =>
        expect(
          screen.getByRole("img", { name: "Nova" }).getAttribute("src"),
        ).toContain("sculpted.png"),
      { timeout: 10000 },
    );
    expect(polls).toBe(2);
    expect(screen.queryByRole("status")).toBeNull();
  },
  POLLING_TEST_TIMEOUT,
);

test("offers regeneration when polling fails", async () => {
  server.use(
    http.post("*/api/experts/avatars/generations", () =>
      HttpResponse.json(
        { id: "failed-poll-job", status: "pending" },
        { status: 202 },
      ),
    ),
    http.get("*/api/experts/avatars/generations/failed-poll-job", () =>
      HttpResponse.json({}, { status: 500 }),
    ),
  );
  render(
    <ExpertAvatarPicker name="Nova" category="development" onPick={vi.fn()} />,
  );

  await userEvent.click(screen.getByRole("button", { name: "Regenerate" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not check generation. Try again or regenerate.",
  );
});
