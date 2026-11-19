import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import type { SkillLearningDetail } from "@/app/api/__generated__/models/skillLearningDetail";
import { ChangesView } from "../components/ChangesView";
import { DecisionView } from "../components/DecisionView";
import { SummaryView } from "../components/SummaryView";
import { HistoryView } from "../components/HistoryView";

const base: SkillVersionSummary = {
  id: "v1",
  skill_name: "Original skill",
  expert_id: null,
  version: 1,
  origin: "user",
  origin_label: "Raw origin",
  summary: "Raw summary",
  state: "ready",
  state_label: "Raw state",
  state_reason: "Raw reason",
  created_at: new Date("2026-11-01T00:00:00Z"),
  description: "Raw description",
  body: "1. Keep Original before",
};
const proposal = {
  ...base,
  id: "v2",
  version: 2,
  base_version_id: "v1",
  body: "1. Keep Original after",
};

test("passes the locale to step changes without translating skill contents", () => {
  render(
    <LanguageProvider>
      <ChangesView
        version={proposal}
        versions={[base, proposal]}
        onSelect={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("步骤 1")).toBeDefined();
  expect(screen.getByText("Keep Original before")).toBeDefined();
  expect(screen.getByText("Keep Original after")).toBeDefined();
});

test("passes the locale to proposal changes and preserves the editable draft", () => {
  render(
    <LanguageProvider>
      <DecisionView
        proposal={proposal}
        current={base}
        draft="Raw draft"
        hasPreviousDraft={false}
        onRecoverDraft={vi.fn()}
        isBusy={false}
        onDraftChange={vi.fn()}
        onDecide={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("步骤 1")).toBeDefined();
  expect(screen.getByText("Keep Original after")).toBeDefined();
  expect(screen.getByDisplayValue("Raw draft")).toBeDefined();
});

const learnedVersion = {
  ...base,
  origin_label: "Saved during work",
  state_label: "Ready to use",
};
const detail: SkillLearningDetail = {
  skill_name: base.skill_name,
  expert_id: null,
  state: "paused",
  state_label: "Paused",
  current_version: proposal,
  policy: { auto_improve: false, learning_paused: true, use_paused: false },
  use: {},
};

test("localizes known summary state and origin labels while preserving the business summary", () => {
  render(
    <LanguageProvider>
      <SummaryView
        detail={detail}
        version={learnedVersion}
        isBusy={false}
        onPolicy={vi.fn()}
        onEdit={vi.fn()}
        onReport={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByTestId("version-state").textContent).toBe("可使用");
  expect(screen.queryByText(/Saved during work/)).toBeNull();
  expect(screen.queryByText(/Paused/)).toBeNull();
  expect(screen.queryByText("Ready to use")).toBeNull();
  expect(screen.getByText("Raw summary")).toBeDefined();
});

test("localizes version picker labels and preserves unknown backend labels", () => {
  render(
    <LanguageProvider>
      <ChangesView
        version={learnedVersion}
        versions={[learnedVersion, proposal]}
        onSelect={vi.fn()}
      />
    </LanguageProvider>,
  );
  const option = screen.getAllByRole("option")[0];
  expect(option.textContent).toBe("v1 · 工作期间保存 · 可使用");
  expect(
    screen.getByRole("option", { name: "v2 · Raw origin · Raw state" }),
  ).toBeDefined();
});

test("localizes known history labels without translating the business summary or restore ID", () => {
  const onRestore = vi.fn();
  render(
    <LanguageProvider>
      <HistoryView
        versions={[learnedVersion]}
        currentVersionId={proposal.id}
        isBusy={false}
        onRestore={onRestore}
        onSelect={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.queryByText(/Saved during work/)).toBeNull();
  expect(screen.queryByText(/Ready to use/)).toBeNull();
  expect(screen.getByText(/Raw summary/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "恢复 v1" }));
  expect(onRestore).toHaveBeenCalledWith("v1");
});

test("keeps English backend labels when English is selected", () => {
  render(
    <LanguageProvider initialLocale="en">
      <ChangesView
        version={learnedVersion}
        versions={[learnedVersion]}
        onSelect={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("option", {
      name: "v1 · Saved during work · Ready to use",
    }),
  ).toBeDefined();
});
