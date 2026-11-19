import { RAISE_PROMPTS, type RaiseDraft } from "./helpers";

// One beat per question: the question waits for the previous answer, and the
// controls it introduces wait for the question to finish typing.
export const BEAT_KEYS = [
  "category",
  "jobTitle",
  "name",
  "avatar",
  "about",
  "voice",
  "budget",
  "marketplace",
  "skills",
] as const;

export type BeatKey = (typeof BEAT_KEYS)[number];

export interface RaiseProgress {
  prompts: Record<BeatKey, boolean>;
  steps: Record<BeatKey, boolean>;
}

export type RaiseFlowItem =
  | { kind: "message"; id: string; role: "autogpt" | "user"; text: string }
  | { kind: "startButton"; id: string }
  | { kind: "step"; id: string; beat: BeatKey };

// Derived from the draft rather than accumulated, so refresh restores and
// back transitions always rebuild the same stream.
export function buildFlowItems(
  draft: RaiseDraft,
  progress: RaiseProgress,
  t: (english: string, chinese: string) => string = (english) => english,
): RaiseFlowItem[] {
  const name = draft.name || t("your expert", "你的专家");
  const items: RaiseFlowItem[] = [
    {
      kind: "message",
      id: "autogpt-greeting",
      role: "autogpt",
      text: t(
        RAISE_PROMPTS.greeting,
        "你好，我是 Otto。我会帮助你创建专属 AI 专家。",
      ),
    },
    { kind: "startButton", id: "start-button" },
  ];

  const questions: Record<BeatKey, string> = {
    category: t(
      RAISE_PROMPTS.categoryQuestion,
      "首先，你的专家应在哪个领域工作？这也会决定其颜色。",
    ),
    jobTitle: t(RAISE_PROMPTS.jobTitleQuestion, "专家的职位是什么？"),
    name: t(RAISE_PROMPTS.nameQuestion, "不错的选择。你想给专家取什么名字？"),
    avatar: t(
      RAISE_PROMPTS.avatarQuestion(draft.name),
      `这是 ${name} 的头像。你可以使用它、重新生成或上传图片。`,
    ),
    about: t(
      RAISE_PROMPTS.aboutQuestion(draft.name),
      `关于 ${name}，还有什么需要我了解的吗？例如工作方式、你重视的事情，也可以跳过。`,
    ),
    voice: t(
      RAISE_PROMPTS.voiceQuestion(draft.name),
      `${name} 写作时应使用什么语气？选择你觉得合适的风格。`,
    ),
    budget: t(
      RAISE_PROMPTS.budgetQuestion(draft.name),
      `${name} 每周可以使用多少预算？默认为每周 $5，你可以选择金额或跳过。`,
    ),
    marketplace: t(
      RAISE_PROMPTS.marketplaceQuestion(draft.name),
      `想让 ${name} 运行工作流吗？搜索市场和你的库，添加喜欢的工作流，也可以跳过。`,
    ),
    skills: t(
      RAISE_PROMPTS.skillsQuestion(draft.name),
      `想为 ${name} 添加额外技能吗？从市场或你的库中添加，也可以跳过。`,
    ),
  };

  BEAT_KEYS.forEach((beat) => {
    if (progress.prompts[beat]) {
      items.push({
        kind: "message",
        id: questionId(beat),
        role: "autogpt",
        text: questions[beat],
      });
    }
    if (progress.steps[beat]) {
      items.push({ kind: "step", id: stepId(beat), beat });
    }
  });

  return items;
}

export function questionId(beat: BeatKey) {
  return `autogpt-${beat}-question`;
}

export function stepId(beat: BeatKey) {
  return `${beat}-step`;
}

// Each beat's question is asked once the beat before it has an answer. The
// skills beat is also conditional: with nothing to offer it never opens, and
// the marketplace beat before it becomes the flow's last.
export function beatTriggers(
  draft: RaiseDraft,
  hasSkillsBeat: boolean,
): Record<BeatKey, boolean> {
  return {
    category: draft.hasStarted,
    jobTitle: draft.category !== null,
    name: draft.jobTitle !== null,
    avatar: draft.name !== "",
    about: draft.avatarUrl !== null,
    voice: draft.about !== null,
    budget: draft.voiceLabel !== null,
    marketplace: draft.budget !== null,
    skills: hasSkillsBeat && draft.marketplace !== null,
  };
}

function beatAnswers(draft: RaiseDraft): Record<BeatKey, boolean> {
  return {
    category: draft.category !== null,
    jobTitle: draft.jobTitle !== null,
    name: draft.name !== "",
    avatar: draft.avatarUrl !== null,
    about: draft.about !== null,
    voice: draft.voiceLabel !== null,
    budget: draft.budget !== null,
    marketplace: draft.marketplace !== null,
    skills: draft.skills !== null,
  };
}

export function lastAnsweredBeat(draft: RaiseDraft): BeatKey | null {
  const answers = beatAnswers(draft);
  return BEAT_KEYS.filter((beat) => answers[beat]).pop() ?? null;
}

// Going back re-opens a beat by dropping its answer; every question after it
// disappears on its own because the stream is derived from the answers.
export function clearedAnswer(beat: BeatKey): Partial<RaiseDraft> {
  switch (beat) {
    case "category":
      // The color is answered in the same beat, so going back re-opens both.
      return { category: null, color: null, legacyRole: undefined };
    case "jobTitle":
      return { jobTitle: null };
    case "name":
      return { name: "" };
    case "avatar":
      return { avatarUrl: null };
    case "about":
      return { about: null };
    case "voice":
      return { voicePreferences: "", voiceLabel: null };
    case "budget":
      return { budget: null };
    case "marketplace":
      return { marketplace: null };
    case "skills":
      return { skills: null };
  }
}
