import { getListMyExpertMemoryFactsMockHandler200 } from "@/app/api/__generated__/endpoints/memory/memory.msw";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { LearnedNotes } from "../components/SoulDrawer/components/LearnedNotes/LearnedNotes";

test("uses the Soul locale for memory timestamps without translating the memory", async () => {
  const clock = vi
    .spyOn(Date, "now")
    .mockReturnValue(Date.parse("2026-11-18T12:00:00Z"));
  server.use(
    getListMyExpertMemoryFactsMockHandler200({
      expert_id: "original-expert",
      items: [
        {
          uuid: "original-fact",
          name: "Original name",
          fact: "Original fact",
          source: "Original source",
          target: "Original target",
          created_at: "2026-11-16T12:00:00Z",
        },
      ],
    }),
  );

  try {
    const { rerender } = render(
      <LanguageProvider initialLocale="zh-CN">
        <LearnedNotes expertId="original-expert" />
      </LanguageProvider>,
    );
    expect(await screen.findByText("Original fact")).toBeDefined();
    expect(screen.getByText("2 天前")).toBeDefined();

    rerender(<LearnedNotes expertId="original-expert" />);
    expect(await screen.findByText("Original fact")).toBeDefined();
    expect(screen.getByText("2 days ago")).toBeDefined();
  } finally {
    clock.mockRestore();
  }
});
