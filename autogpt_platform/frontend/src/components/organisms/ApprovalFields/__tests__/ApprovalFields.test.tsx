import { expect, test } from "vitest";
import { getListExpertIdentitiesQueryKey } from "@/app/api/__generated__/endpoints/experts/experts";
import { getListExpertIdentitiesMockHandler200 } from "@/app/api/__generated__/endpoints/experts/experts.msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/mocks/mock-server";
import { render, screen, within } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { ApprovalFields } from "../ApprovalFields";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ReferenceValue } from "../components/ReferenceValue";
import { ReferenceLink } from "../components/ReferenceLink";
import type { Reference } from "../helpers";

const expertReference: Reference = {
  key: "expert_id",
  entity: "expert",
  id: "exp-maria",
  name: "Maria",
  href: "/team/exp-maria",
  kind: "Expert",
  description: "Maria drafts the newsletter.",
  meta: [{ text: "SEO & Content", cron: null, label: null, at: null }],
  avatarURL: "/autogpt-characters/v1.1/expert-maria/neutral/128.webp",
  avatarColor: null,
  skills: [],
  summary: "SEO & Content",
};

test("uses the stored profession on the approval link and hover card, not in the draft", async () => {
  render(
    <LanguageProvider>
      <ApprovalFields
        fields={[]}
        values={{ expert_id: "exp-maria", subject: "A draft from Maria" }}
        references={[expertReference]}
      />
    </LanguageProvider>,
  );

  const link = screen.getByRole("link", { name: "SEO 内容经理" });
  expect(link.getAttribute("href")).toBe("/team/exp-maria");
  expect(screen.getByText("A draft from Maria")).toBeDefined();
  await userEvent.hover(link);
  const tooltip = within(await screen.findByRole("tooltip"));
  expect(tooltip.getByText("SEO 内容经理")).toBeDefined();
  expect(tooltip.getByText("Maria drafts the newsletter.")).toBeDefined();
  expect(tooltip.getByText("exp-maria")).toBeDefined();
});

test("does not repeat a personal name when an old reference has no role", () => {
  render(
    <ReferenceLink reference={{ ...expertReference, meta: [], summary: null }}>
      Maria
    </ReferenceLink>,
  );
  expect(screen.getByRole("link", { name: "AI Expert" })).toBeDefined();
});

test("prefers the cached roster title for a resolved expert alias", async () => {
  let reads = 0;
  server.use(
    getListExpertIdentitiesMockHandler200(() => {
      reads += 1;
      return [];
    }),
  );
  const cache = new QueryClient();
  cache.setQueryData(
    getListExpertIdentitiesQueryKey(),
    {
      status: 200,
      data: [
        {
          id: "exp-maria",
          name: "Maria",
          role: "SEO & Content",
          job_title: "Editorial Lead",
          avatar_url: expertReference.avatarURL,
          is_archived: true,
        },
      ],
    },
    { updatedAt: Date.now() - 120_000 },
  );
  render(
    <QueryClientProvider client={cache}>
      <ReferenceLink
        reference={{
          ...expertReference,
          entity: "expert_or_name",
          id: "Maria",
          avatarURL: null,
        }}
      >
        Maria
      </ReferenceLink>
    </QueryClientProvider>,
  );

  const link = screen.getByRole("link", { name: "Editorial Lead" });
  expect(link.getAttribute("href")).toBe("/team/exp-maria");
  await userEvent.hover(link);
  const tooltip = within(await screen.findByRole("tooltip"));
  expect(
    tooltip
      .getByRole("img", { name: "Editorial Lead, AI Expert" })
      .getAttribute("src"),
  ).toBe("/experts/professional/expert-maria.webp");
  expect(reads).toBe(0);
});

test.each(["expert", "expert_or_name"])(
  "resolves an ID-only %s approval field without naming unknown IDs",
  (entity) => {
    const cache = new QueryClient();
    cache.setQueryData(getListExpertIdentitiesQueryKey(), {
      status: 200,
      data: [
        {
          id: "exp-maria",
          name: "Maria",
          role: "SEO & Content",
          avatar_url: null,
          is_archived: false,
        },
      ],
    });
    const unresolved = {
      ...expertReference,
      entity,
      key: "expert_ids",
      name: null,
      href: null,
      kind: null,
      meta: [],
      avatarURL: null,
      summary: null,
    };
    render(
      <QueryClientProvider client={cache}>
        <ApprovalFields
          fields={[]}
          values={{ expert_ids: ["exp-maria", "exp-other"] }}
          references={[unresolved, { ...unresolved, id: "exp-other" }]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("SEO Content Manager")).toBeDefined();
    expect(screen.getByText("exp-other")).toBeDefined();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  },
);

test("keeps the stored handoff wording when it includes the original task", () => {
  const name = "Maria to take on Review the Q3 report";
  render(
    <ReferenceLink
      reference={{
        ...expertReference,
        entity: "team_change",
        kind: "New hire with a first task",
        name,
        href: null,
      }}
    >
      {name}
    </ReferenceLink>,
  );
  expect(screen.getByText(name)).toBeDefined();
});

test.each([
  ["en", "+2 more"],
  ["zh-CN", "还有 2 项"],
] as const)(
  "keeps the reference overflow count readable in %s",
  (locale, expected) => {
    render(
      <LanguageProvider initialLocale={locale}>
        <ReferenceValue refs={[]} total={2} />
      </LanguageProvider>,
    );
    expect(screen.getByText(expected)).toBeDefined();
  },
);

test.each([
  ["seconds", 90, "1 分钟 30 秒"],
  ["cron", "0 9 * * *", "每天 09:00"],
  ["cron", "Keep original invalid cron", "Keep original invalid cron"],
])(
  "localizes %s presentation while preserving caller labels",
  (format, value, expected) => {
    render(
      <LanguageProvider>
        <ApprovalFields
          fields={[{ key: "when", label: "Original label", format }]}
          values={{ when: value }}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("Original label")).toBeDefined();
    expect(screen.getByText(expected)).toBeDefined();
  },
);

test.each([
  ["seconds", 59, "59 seconds"],
  ["seconds", 90, "1 minute 30 seconds"],
  ["seconds", 3_599, "59 minutes 59 seconds"],
  ["seconds", 5_400, "1 hour 30 minutes"],
  ["seconds", 86_400, "1 day"],
  [
    "cron",
    ["0 9 * * *", "0 17 * * *"],
    "Every day at 09:00, Every day at 17:00",
  ],
  // Anything the card cannot word shows as it did before hints existed.
  ["seconds", "soon", "soon"],
  ["cron", "at nine", "at nine"],
  ["date-time", "2026-10-02T09:00:00Z", "2026-10-02T09:00:00Z"],
  [null, 180, "180"],
])("format %s shows %j as %s", (format, value, text) => {
  render(
    <ApprovalFields
      fields={[{ key: "when", label: "When", format }]}
      values={{ when: value }}
    />,
  );
  expect(screen.getByText(text)).toBeDefined();
});
