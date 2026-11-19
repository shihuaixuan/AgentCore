import { afterEach, expect, test, vi } from "vitest";
import {
  getGetV2GetCopilotUsageMockHandler200,
  getGetV2GetCopilotUsageResponseMock200,
} from "@/app/api/__generated__/endpoints/chat/chat.msw";
import { getGetTrialsGetTrialStatusMockHandler200 } from "@/app/api/__generated__/endpoints/trials/trials.msw";
import { render, screen, within } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { server } from "@/mocks/mock-server";
import { CancelTrialFeedbackDialog } from "@/components/organisms/FeedbackPrompts/CancelTrialFeedbackDialog";
import { WalletCopilotUsage } from "@/components/layout/Navbar/components/Wallet/components/WalletCopilotUsage";
import { TrialTimeLeft } from "../TrialCanceledDialog/components/TrialTimeLeft";
import { TrialCancelPending } from "../TrialCancelPending";
import { WorthDoingPanel } from "../TrialCanceledDialog/components/WorthDoingPanel";
import { WalletTrialNote } from "@/components/layout/Navbar/components/Wallet/components/WalletTrialNote";
import {
  setTrialUser,
  trialOffer,
  trialResponse,
} from "@/tests/integrations/trial-fixtures";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  setTrialUser(null);
});

test.each(["en", "zh-CN"] as const)(
  "keeps the cancellation end date emphasized with %s copy",
  (locale) => {
    const endDate = "2030-09-17 15:00 UTC";
    render(
      <LanguageProvider initialLocale={locale}>
        <CancelTrialFeedbackDialog endDate={endDate} />
      </LanguageProvider>,
    );

    const dialog = screen.getByRole("dialog", {
      name: locale === "zh-CN" ? "取消试用？" : "Cancel your trial?",
    });
    const emphasizedDate = within(dialog).getByText(endDate);
    expect(emphasizedDate.tagName).toBe("STRONG");
    expect(emphasizedDate.closest("p")?.textContent).toBe(
      locale === "zh-CN"
        ? `你仍可完整使用至 ${endDate}，并可在此之前随时恢复试用。`
        : `You keep full access until ${endDate}, and you can resume your trial any time before then.`,
    );
  },
);

test("formats the trial end in Chinese across pending, wallet and reminder surfaces", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2030, 8, 12, 15));
  const endsAt = new Date(2030, 8, 17, 15);
  const trial = trialResponse({ ends_at: endsAt, cancel_at_period_end: true });
  render(
    <LanguageProvider>
      <TrialCancelPending
        trial={trial}
        offer={trialOffer}
        isResuming={false}
        onResume={vi.fn()}
      />
      <WorthDoingPanel offer={trialOffer} endsAt={endsAt} />
      <WalletTrialNote id="trial-note" trial={trial} />
    </LanguageProvider>,
  );

  expect(
    screen.getByText(/恢复后可继续试用，并于 9月17日 开始使用/),
  ).toBeDefined();
  expect(screen.getByText(/套餐将在9月17日开始/)).toBeDefined();
  expect(screen.getByText("试用将于 9月17日 结束")).toBeDefined();
});

test.each(["en", "zh-CN"] as const)(
  "keeps the remaining trial days emphasized with %s copy",
  (locale) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2030, 8, 12, 15));
    render(
      <LanguageProvider initialLocale={locale}>
        <p>
          <TrialTimeLeft endsAt={new Date(2030, 8, 17, 15)} />
        </p>
      </LanguageProvider>,
    );

    const days = screen.getByText(locale === "zh-CN" ? "5 天" : "5 days");
    expect(days.tagName).toBe("STRONG");
    expect(days.closest("p")?.textContent).toContain(
      locale === "zh-CN"
        ? "你仍有 5 天完整使用权限，将于 "
        : "You still have 5 days of full access, until ",
    );
  },
);

test.each([
  {
    name: "full date",
    endsAt: new Date(2030, 8, 17, 14, 10),
    expected: "结束时间： 2030年9月17日 14:10",
  },
  {
    name: "missing-date fallback",
    endsAt: null,
    expected: "结束时间： 试用结束时",
  },
])(
  "shows the Chinese wallet $name with an English system default",
  async ({ endsAt, expected }) => {
    const nativeToLocaleString = Date.prototype.toLocaleString;
    vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(function (
      this: Date,
      locales,
      options,
    ) {
      return nativeToLocaleString.call(this, locales ?? "en-US", options);
    });
    setTrialUser();
    server.use(
      getGetV2GetCopilotUsageMockHandler200(
        getGetV2GetCopilotUsageResponseMock200({
          daily: null,
          weekly: null,
          tier: "TRIAL",
          reset_cost: 0,
        }),
      ),
      getGetTrialsGetTrialStatusMockHandler200(
        trialResponse({ ends_at: endsAt }),
      ),
    );
    render(
      <LanguageProvider initialLocale="zh-CN">
        <WalletCopilotUsage />
      </LanguageProvider>,
    );

    expect(await screen.findByText(expected)).toBeDefined();
  },
);

test.each([
  {
    day: "today",
    now: new Date(2030, 8, 17, 11, 10),
    expected: "你仍可完整使用至 14:10（今天），期间不会有任何变化。",
  },
  {
    day: "tomorrow",
    now: new Date(2030, 8, 16, 22),
    expected: "你仍可完整使用至 14:10（明天），期间不会有任何变化。",
  },
])(
  "shows a Chinese $day trial clock with an English system default",
  ({ now, expected }) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const nativeToLocaleTimeString = Date.prototype.toLocaleTimeString;
    vi.spyOn(Date.prototype, "toLocaleTimeString").mockImplementation(function (
      this: Date,
      locales,
      options,
    ) {
      return nativeToLocaleTimeString.call(this, locales ?? "en-US", options);
    });
    render(
      <LanguageProvider initialLocale="zh-CN">
        <p>
          <TrialTimeLeft endsAt={new Date(2030, 8, 17, 14, 10)} />
        </p>
      </LanguageProvider>,
    );

    expect(screen.getByText(expected)).toBeDefined();
  },
);
