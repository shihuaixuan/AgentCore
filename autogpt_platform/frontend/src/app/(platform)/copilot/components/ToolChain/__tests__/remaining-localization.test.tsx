import { render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { expect, it } from "vitest";
import { ExpertChangeCardSkeleton } from "../ExpertCards";
import { BlockListCard } from "../BlockCards";
import { SubSessionCard } from "../AgentCards";

it("localizes loading shells, unnamed blocks and sub-session durations", () => {
  render(
    <LanguageProvider>
      <ExpertChangeCardSkeleton />
      <BlockListCard blocks={[{}]} />
      <SubSessionCard
        output={{
          status: "completed",
          elapsed_seconds: 65,
          response: "Raw English answer",
        }}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("创建专家")).toBeDefined();
  expect(screen.getByText("模块")).toBeDefined();
  expect(screen.getByText("1 分 5 秒")).toBeDefined();
  expect(screen.getByText("Raw English answer")).toBeDefined();
});
