import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { NameStep } from "../components/NameStep/NameStep";
import { JobTitleStep } from "../components/JobTitleStep/JobTitleStep";
import { KitBudget } from "../components/KitStep/KitBudget";
import { CategoryStep } from "../components/CategoryStep/CategoryStep";
import { BEAT_KEYS, buildFlowItems } from "../flowItems";
import { EMPTY_DRAFT } from "../helpers";
import { SoulPreviewPanel } from "../components/SoulPreviewPanel/SoulPreviewPanel";

function Conversation() {
  const { t, setLocale } = useTranslation();
  const progress = Object.fromEntries(
    BEAT_KEYS.map((beat) => [beat, true]),
  ) as Record<(typeof BEAT_KEYS)[number], boolean>;
  const items = buildFlowItems(
    { ...EMPTY_DRAFT, name: "Original Nova" },
    { prompts: progress, steps: progress },
    t,
  );
  return (
    <>
      <button onClick={() => setLocale("en")}>English</button>
      {items.map((item) =>
        item.kind === "message" ? <p key={item.id}>{item.text}</p> : null,
      )}
    </>
  );
}

test("translates creation conversation prompts while preserving interpolated names", () => {
  render(
    <LanguageProvider>
      <Conversation />
    </LanguageProvider>,
  );
  expect(
    screen.getByText("你好，我是 Otto。我会帮助你创建专属 AI 专家。"),
  ).toBeDefined();
  expect(
    screen.getByText(
      "这是 Original Nova 的头像。你可以使用它、重新生成或上传图片。",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByText(
      "Hello, I'm Otto. I'll help you create your own AI Expert.",
    ),
  ).toBeDefined();
});

function SwitchLanguage() {
  const { setLocale } = useTranslation();
  return <button onClick={() => setLocale("en")}>English</button>;
}

test("translates name controls and preserves typed names through language changes", () => {
  const onSubmit = vi.fn();
  render(
    <LanguageProvider>
      <SwitchLanguage />
      <NameStep
        selectedName={null}
        suggestions={["Nova"]}
        color={null}
        onSubmit={onSubmit}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("group", { name: "推荐姓名" })).toBeDefined();
  const input = screen.getByRole("textbox", { name: "或输入自定义姓名" });
  expect(input.getAttribute("placeholder")).toBe("输入姓名…");
  fireEvent.change(input, { target: { value: "My 自定义 Name" } });
  expect(
    (screen.getByRole("button", { name: "为我命名" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    (
      screen.getByRole("textbox", {
        name: "Or type your own",
      }) as HTMLInputElement
    ).value,
  ).toBe("My 自定义 Name");
  fireEvent.click(screen.getByRole("button", { name: "Name me" }));
  expect(onSubmit).toHaveBeenCalledWith("My 自定义 Name");
});

test("translates job title controls but does not translate suggested or entered titles", () => {
  render(
    <LanguageProvider>
      <JobTitleStep
        selectedTitle={null}
        suggestions={["My Custom Role"]}
        color={null}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("group", { name: "推荐职位" })).toBeDefined();
  expect(screen.getByRole("button", { name: "My Custom Role" })).toBeDefined();
  expect(
    screen.getByRole("textbox", { name: "职位" }).getAttribute("placeholder"),
  ).toBe("输入职位…");
  expect(screen.getByRole("button", { name: "添加职位" })).toBeDefined();
  expect(screen.getByRole("button", { name: "跳过" })).toBeDefined();
});

test("translates category display labels while submitting the original API identifier", () => {
  const onPick = vi.fn();
  render(
    <LanguageProvider>
      <CategoryStep selectedCategory={null} color={null} onPick={onPick} />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "市场营销" }));
  expect(onPick).toHaveBeenCalledWith("marketing");
});

test("translates budget labels while retaining preset credit amounts", () => {
  const onSelect = vi.fn();
  render(
    <LanguageProvider>
      <KitBudget
        weeklyBudget={null}
        customAmount=""
        color={null}
        onSelect={onSelect}
        onCustomChange={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("group", { name: "每周预算" })).toBeDefined();
  expect(
    screen
      .getByRole("textbox", { name: "自定义每周预算（美元）" })
      .getAttribute("placeholder"),
  ).toBe("自定义金额，例如 $7.50…");
  fireEvent.click(screen.getByRole("button", { name: "不设每周上限" }));
  expect(onSelect).toHaveBeenCalledWith(0);
});

test("translates the soul preview and switches labels without translating user details", () => {
  render(
    <LanguageProvider>
      <SwitchLanguage />
      <SoulPreviewPanel
        name="Original Nova"
        category="marketing"
        jobTitle="Custom Role"
        avatarUrl="/original-avatar.png"
        color={null}
        about="Original biography"
        voiceLabel="Original voice"
        kit={{
          weeklyBudget: 0,
          attachments: [
            {
              kind: "skill",
              source: "library",
              id: "original",
              name: "Original Skill",
            },
          ],
        }}
      />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("img", { name: "Original Nova 的头像" }),
  ).toBeDefined();
  for (const label of [
    "关于",
    "声音",
    "每周预算",
    "工具",
    "不设每周上限",
    "Original biography",
    "Original voice",
    "Original Skill",
    "Custom Role",
  ]) {
    expect(screen.getByText(label)).toBeDefined();
  }
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(
    screen.getByRole("img", { name: "Original Nova's picture" }),
  ).toBeDefined();
  expect(screen.getByText("No weekly limit")).toBeDefined();
  expect(screen.getByText("Custom Role")).toBeDefined();
});

test("translates an unnamed preview and built-in category role", () => {
  render(
    <LanguageProvider>
      <SoulPreviewPanel
        name=""
        category="marketing"
        avatarUrl="/original-avatar.png"
        color={null}
        about={null}
        voiceLabel={null}
        kit={null}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("heading", { name: "尚未命名" })).toBeDefined();
  expect(screen.getByRole("img", { name: "你的专家的头像" })).toBeDefined();
  expect(screen.getByText("营销专员")).toBeDefined();
});
