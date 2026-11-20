import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ExpertIdentityDetails } from "./ExpertIdentityDetails";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

describe("ExpertIdentityDetails", () => {
  test.each(["card", "page"] as const)(
    "falls back to the role label on the name line in %s size",
    (size) => {
      render(
        <ExpertIdentityDetails
          name="Jules"
          role="Social & Content Repurposing"
          size={size}
        />,
      );

      expect(screen.getAllByText(/Social Media Manager/)).toHaveLength(1);
      expect(screen.queryByText("AI Expert")).toBeNull();
    },
  );

  test.each(["card", "page"] as const)(
    "renders the job title as the only name in %s size",
    (size) => {
      render(
        <ExpertIdentityDetails
          name="Jules"
          role="Social & Content Repurposing"
          jobTitle="Social Media Manager"
          size={size}
        />,
      );

      expect(screen.getByText("Social Media Manager")).toBeDefined();
      expect(screen.queryByText(/Jules/)).toBeNull();
      expect(screen.queryByText("AI Expert")).toBeNull();
      expect(screen.queryByText("Social media")).toBeNull();
    },
  );

  test("shows the job title as the compact text", () => {
    render(
      <ExpertIdentityDetails
        name="Jules"
        role="Social & Content Repurposing"
        jobTitle="Social Media Manager"
        size="compact"
      />,
    );

    expect(screen.getByText("Social Media Manager")).toBeDefined();
    expect(screen.queryByText("Social media")).toBeNull();
  });

  test("keeps the compact area as small plain text", () => {
    const { container } = render(
      <ExpertIdentityDetails
        name="Jules"
        role="Social & Content Repurposing"
        size="compact"
      />,
    );
    expect(screen.getByText("Social Media Manager").tagName).toBe("SPAN");
    expect(container.querySelector("svg")).toBeNull();
  });
});

test("does not grant Otto's identity exception from a specialist title", () => {
  render(<ExpertIdentityDetails name="My Expert" role="Head of AI" />);
  expect(screen.getByText(/Head of AI/)).toBeDefined();
  expect(screen.queryByText("Your personal Head of AI")).toBeNull();
});

test.each(["compact", "card", "page"] as const)(
  "discloses AI for an Expert without a role or title in %s size",
  (size) => {
    render(
      <ExpertIdentityDetails
        name="My Expert"
        role={null}
        jobTitle={null}
        size={size}
      />,
    );
    expect(screen.getByText("AI Expert")).toBeDefined();
    expect(screen.queryByText("Your personal Head of AI")).toBeNull();
  },
);

test("keeps Otto's disclosure without a role or title", () => {
  render(<ExpertIdentityDetails name="通用办公助手" isOtto />);
  expect(screen.getByText("Your personal Head of AI")).toBeDefined();
  expect(screen.queryByText("AI Expert")).toBeNull();
});

test("shows only the profession for a compact specialist", () => {
  render(
    <ExpertIdentityDetails name="Mina" jobTitle="Bookkeeper" size="compact" />,
  );
  expect(screen.queryByText("Mina")).toBeNull();
  expect(screen.getByText("Bookkeeper")).toBeDefined();
  expect(screen.queryByText("AI Expert")).toBeNull();
});

test.each(["compact", "card", "page"] as const)(
  "avoids repeating 通用办公助手's role in %s size",
  (size) => {
    render(
      <ExpertIdentityDetails
        name="通用办公助手"
        isOtto
        role="Head of AI"
        size={size}
      />,
    );
    expect(screen.getByText(/Head of AI/)).toBeDefined();
    expect(screen.queryByText("Your personal Head of AI")).toBeNull();
  },
);

test.each(["compact", "card", "page"] as const)(
  "localizes 通用办公助手's default role and title in Chinese in %s size",
  (size) => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ExpertIdentityDetails
          name="通用办公助手"
          isOtto
          role="Head of AI"
          size={size}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("通用办公助手")).toBeDefined();
    expect(screen.getByTitle("AI 负责人").textContent).toContain("AI 负责人");
    expect(screen.queryByText(/Head of AI/)).toBeNull();
  },
);

test.each([
  { isOtto: true, expected: "您的专属 AI 负责人" },
  { isOtto: false, expected: "AI 专家" },
])("localizes the fallback disclosure: $expected", ({ isOtto, expected }) => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ExpertIdentityDetails name="Alex" isOtto={isOtto} />
    </LanguageProvider>,
  );

  expect(screen.getByText(expected)).toBeDefined();
});

test.each([
  { role: "Custom AI Lead", jobTitle: null, expected: "Custom AI Lead" },
  { role: "Head of AI", jobTitle: "Head of AI", expected: "Head of AI" },
  { role: "Head of AI", jobTitle: "AI Expert", expected: "AI Expert" },
])(
  "preserves custom identity text: $expected",
  ({ role, jobTitle, expected }) => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ExpertIdentityDetails
          name="Alex"
          role={role}
          jobTitle={jobTitle}
          size="compact"
        />
      </LanguageProvider>,
    );

    expect(screen.getByTitle(expected).textContent).toBe(expected);
  },
);

test.each(["compact", "card", "page"] as const)(
  "localizes the exact built-in Head of AI role for a specialist in %s size",
  (size) => {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ExpertIdentityDetails name="Alex" role="Head of AI" size={size} />
      </LanguageProvider>,
    );
    expect(screen.getByTitle("AI 负责人").textContent).toContain("AI 负责人");
    expect(screen.queryByText(/Head of AI/)).toBeNull();
    expect(screen.queryByText("您的专属 AI 负责人")).toBeNull();
  },
);
