import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { render } from "@/tests/integrations/test-utils";
import type { UIDataTypes, UIMessage, UITools } from "ai";
import { describe, expect, it } from "vitest";
import { CANCELLED_MARKER } from "../../../useCopilotStop";
import { TurnEndAnnouncer } from "../TurnEndAnnouncer";

type Msg = UIMessage<unknown, UIDataTypes, UITools>;

function assistant(parts: unknown[]): Msg {
  return { id: "reply", role: "assistant", parts: parts as Msg["parts"] };
}

const completed = assistant([{ type: "text", text: "Finished." }]);
const running = assistant([
  { type: "text", text: "Working", state: "streaming" },
]);

function Announcer({
  locale,
  isBusy,
  isSettled,
  messages,
}: {
  locale?: Locale;
  isBusy: boolean;
  isSettled: boolean;
  messages: Msg[];
}) {
  const announcer = (
    <TurnEndAnnouncer
      isBusy={isBusy}
      isSettled={isSettled}
      messages={messages}
    />
  );
  return locale ? (
    <LanguageProvider initialLocale={locale}>{announcer}</LanguageProvider>
  ) : (
    announcer
  );
}

describe("TurnEndAnnouncer localization", () => {
  it.each([
    ["zh-CN", "回复已完成"],
    ["en", "Reply finished"],
    [undefined, "Reply finished"],
  ] as const)("announces a settled live reply in %s", (locale, expected) => {
    const { container, rerender } = render(
      <Announcer
        locale={locale}
        isBusy
        isSettled={false}
        messages={[running]}
      />,
    );
    const live = container.querySelector("[aria-live='polite']")!;
    expect(live.textContent).toBe("");
    rerender(
      <Announcer
        locale={locale}
        isBusy={false}
        isSettled={false}
        messages={[completed]}
      />,
    );
    expect(live.textContent).toBe("");
    rerender(
      <Announcer
        locale={locale}
        isBusy={false}
        isSettled
        messages={[completed]}
      />,
    );
    expect(live.textContent).toBe(expected);
  });

  it("keeps historical replies and refused sends silent", () => {
    const props = { locale: "zh-CN" } as const;
    const { container, rerender } = render(
      <Announcer {...props} messages={[completed]} isBusy={false} isSettled />,
    );
    const live = container.querySelector("[aria-live='polite']")!;
    expect(live.textContent).toBe("");
    rerender(
      <Announcer {...props} messages={[completed]} isBusy isSettled={false} />,
    );
    rerender(
      <Announcer
        {...props}
        messages={[{ ...completed, parts: [...completed.parts] }]}
        isBusy={false}
        isSettled
      />,
    );
    expect(live.textContent).toBe("");
  });

  it.each<[string, unknown[]]>([
    ["stopped", [{ type: "text", text: CANCELLED_MARKER }]],
    ["errored", [{ type: "text", text: "[__COPILOT_ERROR_f7a1__] Error" }]],
    ["streaming", [{ type: "text", text: "Not finished", state: "streaming" }]],
    [
      "waiting for approval",
      [
        {
          type: "tool-run_agent",
          toolCallId: "approval-1",
          state: "output-available",
          input: {},
          output: { type: "approval_required", review_id: "review-1" },
        },
      ],
    ],
  ])("does not announce a %s reply", (_, parts) => {
    const { container, rerender } = render(
      <Announcer
        locale="zh-CN"
        isBusy
        isSettled={false}
        messages={[running]}
      />,
    );
    rerender(
      <Announcer
        locale="zh-CN"
        isBusy={false}
        isSettled
        messages={[assistant(parts)]}
      />,
    );
    expect(container.querySelector("[aria-live='polite']")?.textContent).toBe(
      "",
    );
  });
});
