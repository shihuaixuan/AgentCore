import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { TooltipProvider } from "@/components/atoms/Tooltip/BaseTooltip";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AgentRow } from "../components/AgentTeam/components/AgentRow";
import { AttentionRow } from "../components/NeedsYou/components/AttentionRow";

const expert = {
  id: "maria",
  name: "Maria",
  role: "Planning",
  avatar_url: null,
};

test.each(["zh-CN", "en"] as const)(
  "team rows in %s localize stock copy only",
  (locale) => {
    const customDetail = "Ready for the next task: check Monday's report";
    render(
      <LanguageProvider initialLocale={locale}>
        <TooltipProvider>
          <AgentRow
            agent={{
              expert,
              status: "ready",
              detail: "Ready for the next task",
            }}
          />
          <AgentRow
            agent={{
              expert: { ...expert, id: "ops", name: "Ops", role: "Ops" },
              status: "working",
              detail: customDetail,
            }}
          />
        </TooltipProvider>
      </LanguageProvider>,
    );

    const chinese = locale === "zh-CN";
    expect(screen.getByText(chinese ? "就绪" : "Ready")).toBeDefined();
    expect(
      screen.getByText(
        chinese ? /^已准备好执行下一个任务 / : /^Ready for the next task /,
      ),
    ).toBeDefined();
    expect(screen.getByText(customDetail, { exact: false })).toBeDefined();
    expect(screen.getByText("Planning")).toBeDefined();
  },
);

test.each(["zh-CN", "en"] as const)(
  "Needs you rows in %s preserve question text and action URLs",
  (locale) => {
    const actions = [
      { label: "Answer", href: "/copilot?sessionId=sess%2F1" },
      { label: "Answer later", href: "/copilot?sessionId=sess-2" },
    ];
    render(
      <LanguageProvider initialLocale={locale}>
        {actions.map((action) => (
          <AttentionRow
            key={action.href}
            item={{
              id: action.href,
              kind: "question",
              priority: "normal",
              title: "Maria has a question",
              description:
                action.label === "Answer"
                  ? "Monday or Friday?"
                  : "Which report?",
              why_it_matters: "",
              primary_action: action,
            }}
            isProcessing={false}
            onDecision={vi.fn()}
          />
        ))}
      </LanguageProvider>,
    );

    expect(screen.getByText("Monday or Friday?")).toBeDefined();
    const answer = screen.getByRole("link", {
      name: locale === "zh-CN" ? "回答" : "Answer",
    });
    const later = screen.getByRole("link", { name: "Answer later" });
    expect(answer.getAttribute("href")).toBe(actions[0].href);
    expect(later.getAttribute("href")).toBe(actions[1].href);
  },
);
