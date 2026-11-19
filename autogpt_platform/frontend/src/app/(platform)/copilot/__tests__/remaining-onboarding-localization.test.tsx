import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { OnboardingChoices } from "../components/ExpertOnboardingCard/components/OnboardingChoices/OnboardingChoices";
import { OnboardingFooter } from "../components/ExpertOnboardingCard/components/OnboardingFooter";
import { OnboardingReview } from "../components/ExpertOnboardingCard/components/OnboardingReview";

test("localizes onboarding navigation while keeping answer payloads unchanged", () => {
  const onChoose = vi.fn();
  const onSkip = vi.fn();
  render(
    <LanguageProvider>
      <span id="original-question">Original question</span>
      <OnboardingChoices
        options={["Raw English choice"]}
        answer={undefined}
        isMultiple={false}
        labelId="original-question"
        onChoose={onChoose}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
      <OnboardingFooter
        canGoBack={false}
        isReady
        isReview={false}
        isNextReview={false}
        isSending={false}
        onBack={vi.fn()}
        onSkip={onSkip}
        onNext={vi.fn()}
      />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("radio", { name: /Raw English choice/ }));
  expect(onChoose).toHaveBeenCalledWith("Raw English choice");
  fireEvent.click(screen.getByRole("button", { name: /其他/ }));
  expect(screen.getByPlaceholderText("输入你的回答")).toBeDefined();
  expect(screen.getByRole("button", { name: "下一个问题" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /跳过问题/ }));
  expect(onSkip).toHaveBeenCalledOnce();
});

test("localizes review controls without translating questions or answers", () => {
  const onEdit = vi.fn();
  render(
    <LanguageProvider>
      <OnboardingReview
        steps={[
          {
            keyword: "raw",
            question: "Original question",
            options: [],
            allow_multiple: false,
          },
        ]}
        answers={{ raw: "Original English answer" }}
        labelId="review"
        onEdit={onEdit}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("检查你的回答")).toBeDefined();
  expect(screen.getByText("Original English answer")).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", {
      name: /修改以下问题的回答.*Original question/,
    }),
  );
  expect(onEdit).toHaveBeenCalledWith(0);
});
