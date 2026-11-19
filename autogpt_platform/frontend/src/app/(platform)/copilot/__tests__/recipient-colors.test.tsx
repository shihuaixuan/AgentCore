import {
  render,
  screen,
  waitFor,
  within,
} from "@/tests/integrations/test-utils";
import { server } from "@/mocks/mock-server";
import { http, HttpResponse } from "msw";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { RecipientChip } from "../components/ChatInput/components/RecipientChip";
import { useRecipientPicker } from "../components/EmptySession/useRecipientPicker";

vi.mock("@/services/feature-flags/use-get-flag", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/services/feature-flags/use-get-flag")
  >()),
  useGetFlag: () => true,
}));

function Picker() {
  const { recipient, options, selectRecipient } = useRecipientPicker();
  return (
    <RecipientChip
      recipient={recipient}
      options={options}
      onSelect={selectRecipient}
    />
  );
}

describe("recipient identity", () => {
  it("shows and searches professions, keeps portraits, and selects by expert ID", async () => {
    server.use(
      http.get("*/api/experts/identities", () =>
        HttpResponse.json([
          {
            id: "expert-maria",
            name: "Maria",
            avatar_url:
              "/autogpt-characters/v1.1/expert-maria/neutral/128.webp",
            role: "Content Strategy",
            job_title: "Content Manager",
            is_archived: false,
          },
          {
            id: "expert-nadia",
            name: "Nadia",
            avatar_url: "/experts/clay/v2/nadia.png",
            role: "Sales",
            job_title: " ",
            is_archived: false,
          },
        ]),
      ),
    );
    const onUrlUpdate = vi.fn();
    const Wrapper = withNuqsTestingAdapter({
      searchParams: "?expertId=expert-maria",
      hasMemory: true,
      onUrlUpdate,
    });
    render(
      <LanguageProvider initialLocale="zh-CN">
        <Wrapper>
          <Picker />
        </Wrapper>
      </LanguageProvider>,
    );

    const chip = await screen.findByRole("button", { name: /更换接收者/ });
    expect(within(chip).getByText("Content Manager")).toBeDefined();
    expect(within(chip).queryByText("Maria")).toBeNull();
    expect(chip.querySelector("img")?.getAttribute("src")).toBe(
      "/experts/professional/expert-maria.webp",
    );

    const user = userEvent.setup();
    await user.click(chip);
    const menu = await screen.findByRole("dialog", { name: "专家" });
    const search = within(menu).getByRole("searchbox", { name: "搜索专家" });
    await user.type(search, "Nadia");
    expect(within(menu).getByText("没有匹配的专家")).toBeDefined();
    await user.clear(search);
    await user.type(search, "销售开发");
    const option = await within(menu).findByRole("button", {
      name: "销售开发代表",
    });
    expect(option.querySelector("img")?.getAttribute("src")).toBe(
      "/experts/professional/expert-nadia.webp",
    );
    expect(within(menu).queryByText("Content Manager")).toBeNull();

    await user.click(option);
    expect(
      await screen.findByRole("button", {
        name: "发送给 销售开发代表，更换接收者",
      }),
    ).toBeDefined();
    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("expertId")).toBe(
        "expert-nadia",
      ),
    );
  });

  it("keeps the saved PNG in the selected avatar and menu", async () => {
    server.use(
      http.get("*/api/experts/identities", () =>
        HttpResponse.json([
          {
            id: "expert-maria",
            name: "Maria",
            color: "orange-500",
            avatar_url: "/experts/clay/v1/marketing.png",
            role: "Marketing",
            is_archived: false,
          },
        ]),
      ),
    );
    const Wrapper = withNuqsTestingAdapter({
      searchParams: "?expertId=expert-maria",
      hasMemory: true,
    });
    render(
      <Wrapper>
        <Picker />
      </Wrapper>,
    );
    const chip = await screen.findByRole("button", {
      name: "Sending to Marketing — change recipient",
    });
    await waitFor(() =>
      expect(
        within(chip).getByAltText("Marketing").getAttribute("src"),
      ).toContain("marketing.png"),
    );
    await userEvent.click(chip);
    const menu = await screen.findByRole("dialog", { name: "Experts" });
    expect(
      within(menu).getByAltText("Marketing").getAttribute("src"),
    ).toContain("marketing.png");
  });

  it("keeps the selected expert distinguishable when professions match", async () => {
    server.use(
      http.get("*/api/experts/identities", () =>
        HttpResponse.json(
          ["casey", "sam"].map((id) => ({
            id,
            name: id,
            avatar_url: null,
            role: "Quality Assurance",
            job_title: "QA Engineer",
            is_archived: false,
          })),
        ),
      ),
    );
    const Wrapper = withNuqsTestingAdapter({
      searchParams: "?expertId=casey",
      hasMemory: true,
    });
    render(
      <Wrapper>
        <Picker />
      </Wrapper>,
    );

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: /change recipient/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: "QA Engineer (2)" }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Sending to QA Engineer (2) — change recipient",
      }),
    ).toBeDefined();
  });
});
