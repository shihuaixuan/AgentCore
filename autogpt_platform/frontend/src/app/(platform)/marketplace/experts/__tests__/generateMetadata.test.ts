import { beforeEach, describe, expect, test, vi } from "vitest";

const mockListExpertTemplates = vi.hoisted(() => vi.fn());
const metadataLocale = vi.hoisted(() => ({ current: "en" }));

vi.mock("@/lib/i18n/server", () => ({
  getServerTranslation: async () => ({
    locale: metadataLocale.current,
    t: (english: string, chinese: string) =>
      metadataLocale.current === "zh-CN" ? chinese : english,
  }),
}));

vi.mock(
  "@/app/api/__generated__/endpoints/experts/experts",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/api/__generated__/endpoints/experts/experts")
    >()),
    listExpertTemplates: mockListExpertTemplates,
  }),
);

vi.mock("../[expertId]/components/ExpertPage", () => ({
  ExpertPage: () => null,
}));

import { generateMetadata } from "../[expertId]/page";

const maria = {
  id: "template-maria",
  name: "Maria",
  role: "Marketing",
  tagline: "Turns your product story into campaigns that land.",
  bio: "A senior marketing strategist.",
  avatar_url: "/experts/maria.svg",
};

describe("generateMetadata", () => {
  beforeEach(() => {
    mockListExpertTemplates.mockReset();
    metadataLocale.current = "en";
  });

  test("previews the expert's name, role and tagline", async () => {
    mockListExpertTemplates.mockResolvedValue({ data: [maria] });

    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: "template-maria" }),
    });

    expect(metadata.title).toBe(
      "Maria, Marketing · AI Expert - AutoGPT Marketplace",
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Maria, Marketing · AI Expert - AutoGPT Marketplace",
      description: "Turns your product story into campaigns that land.",
      type: "profile",
    });
    expect(metadata.alternates?.canonical).toContain(
      "/marketplace/experts/template-maria",
    );
  });

  test("never uses the SVG avatar, which no unfurler renders", async () => {
    mockListExpertTemplates.mockResolvedValue({ data: [maria] });

    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: "template-maria" }),
    });

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  });

  test("falls back to a generic title for an unknown expert", async () => {
    mockListExpertTemplates.mockResolvedValue({ data: [maria] });

    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: "nobody" }),
    });

    expect(metadata.title).toBe("Expert - AutoGPT Marketplace");
  });

  test("falls back rather than throwing when the API is unreachable", async () => {
    mockListExpertTemplates.mockRejectedValue(new Error("fetch failed"));

    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: "template-maria" }),
    });

    expect(metadata.title).toBe("Expert - AutoGPT Marketplace");
  });

  test("localizes Chinese metadata and known roles without translating expert content", async () => {
    metadataLocale.current = "zh-CN";
    mockListExpertTemplates.mockResolvedValue({
      data: [{ ...maria, role: "SEO & Content" }],
    });
    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: maria.id }),
    });
    expect(metadata.title).toBe("Maria，SEO 内容经理 · AI 专家 - AutoGPT 市场");
    expect(metadata.openGraph).toMatchObject({
      description: maria.tagline,
      type: "profile",
    });
  });

  test.each([
    { role: "Custom Strategist", job_title: null, title: "Custom Strategist" },
    {
      role: "SEO & Content",
      job_title: "Original Job Title",
      title: "Original Job Title",
    },
  ])(
    "preserves custom roles and job titles in Chinese metadata",
    async ({ role, job_title, title }) => {
      metadataLocale.current = "zh-CN";
      mockListExpertTemplates.mockResolvedValue({
        data: [{ ...maria, role, job_title }],
      });
      const metadata = await generateMetadata({
        params: Promise.resolve({ expertId: maria.id }),
      });
      expect(metadata.title).toBe(`Maria，${title} · AI 专家 - AutoGPT 市场`);
    },
  );

  test("localizes the Chinese metadata fallback for an unknown expert", async () => {
    metadataLocale.current = "zh-CN";
    mockListExpertTemplates.mockResolvedValue({ data: [] });
    const metadata = await generateMetadata({
      params: Promise.resolve({ expertId: "nobody" }),
    });
    expect(metadata.title).toBe("专家 - AutoGPT 市场");
  });
});
