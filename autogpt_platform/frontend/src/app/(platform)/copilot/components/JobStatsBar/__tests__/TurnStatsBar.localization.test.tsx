import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import type { UIDataTypes, UIMessage, UITools } from "ai";
import { describe, expect, it } from "vitest";
import { CANCELLED_MARKER } from "../../../useCopilotStop";
import { TurnStatsBar } from "../TurnStatsBar";

type Msg = UIMessage<unknown, UIDataTypes, UITools>;

function assistant(parts: unknown[]): Msg {
  return { id: "reply", role: "assistant", parts: parts as Msg["parts"] };
}

const reply = { type: "text", text: "Finished." };
const action = {
  type: "tool-run_block",
  toolCallId: "action-1",
  state: "output-available",
  input: {},
  output: {},
};

function SwitchableStats() {
  const { setLocale } = useTranslation();
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      <TurnStatsBar
        turnMessages={[assistant([action, reply])]}
        elapsedSeconds={67}
        stats={{ durationMs: 134_000 }}
      />
    </>
  );
}

describe("TurnStatsBar localization", () => {
  it("switches status, saved duration and counters with the provider", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <SwitchableStats />
      </LanguageProvider>,
    );
    const line = screen.getByTestId("turn-end-line");
    expect(line.textContent).toBe("已完成，用时 2分14秒·1 次操作");
    expect(line.querySelector("svg")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(line.textContent).toBe("Done in 2m 14s·1 action");
  });

  it.each([
    ["thought", [], {}, "思考用时 22秒"],
    ["done without time", [reply], { stats: { durationMs: 0 } }, "已完成"],
    [
      "stopped",
      [reply, { type: "text", text: CANCELLED_MARKER }],
      {},
      "已停止，用时 22秒",
    ],
    ["earlier turn", [reply], { isLatest: false }, "思考用时 22秒"],
    ["unsettled", [reply], { isSettled: false }, "思考用时 22秒"],
    ["settling", [reply], { isSettled: false, isSettling: true }, "22秒"],
  ] as const)(
    "preserves the %s outcome in Chinese",
    (_, parts, props, expected) => {
      render(
        <LanguageProvider initialLocale="zh-CN">
          <TurnStatsBar
            turnMessages={[assistant([...parts])]}
            elapsedSeconds={22}
            {...props}
          />
        </LanguageProvider>,
      );
      const line = screen.getByTestId("turn-end-line");
      expect(line.textContent).toBe(expected);
      expect(line.querySelector("svg") !== null).toBe(expected === "已完成");
    },
  );

  it("still hides a saved sub-second duration instead of showing live time", () => {
    const { container } = render(
      <LanguageProvider initialLocale="zh-CN">
        <TurnStatsBar
          turnMessages={[]}
          elapsedSeconds={67}
          stats={{ durationMs: 400 }}
        />
      </LanguageProvider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it.each([
    ["zh-CN", "思考用时 5秒", "2026年4月23日 08:32"],
    ["en", "Thought for 5s", "Apr 23, 2026, 8:32 AM"],
  ] as const)(
    "uses %s explicitly for the hover date",
    (locale, label, date) => {
      render(
        <LanguageProvider initialLocale={locale}>
          <TurnStatsBar
            turnMessages={[]}
            stats={{
              durationMs: 5_000,
              createdAt: new Date(2026, 3, 23, 8, 32).toISOString(),
            }}
          />
        </LanguageProvider>,
      );
      const timeLabel = screen.getByTestId("turn-end-line").firstElementChild!;
      expect(timeLabel.textContent).toBe(label);
      fireEvent.mouseEnter(timeLabel);
      expect(timeLabel.textContent).toBe(date);
      fireEvent.mouseLeave(timeLabel);
      expect(timeLabel.textContent).toBe(label);
    },
  );

  it("preserves the raw invalid timestamp on hover", () => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <TurnStatsBar
          turnMessages={[]}
          stats={{ durationMs: 5_000, createdAt: "not-a-date" }}
        />
      </LanguageProvider>,
    );
    const timeLabel = screen.getByTestId("turn-end-line").firstElementChild!;
    fireEvent.mouseEnter(timeLabel);
    expect(timeLabel.textContent).toBe("not-a-date");
  });
});
