import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ExpertProtectedRules } from "./ExpertProtectedRules";

afterEach(cleanup);

test.each([
  [
    "zh-CN",
    "对外执行操作时，专家会表明自己是 AI。",
    "对外执行操作前，专家会先征求你的同意。",
  ],
  [
    "en",
    "The expert discloses that it is AI when acting externally.",
    "The expert asks for approval before acting externally.",
  ],
] as const)(
  "localizes built-in rules in %s and preserves other rules",
  (locale, disclosure, approval) => {
    render(
      <LanguageProvider initialLocale={locale}>
        <ExpertProtectedRules
          rules={[
            "The expert discloses that it is AI when acting externally.",
            "The expert asks for approval before acting externally.",
            "Custom rule: keep the API contract unchanged.",
          ]}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText(disclosure)).toBeDefined();
    expect(screen.getByText(approval)).toBeDefined();
    expect(
      screen.getByText("Custom rule: keep the API contract unchanged."),
    ).toBeDefined();
  },
);
