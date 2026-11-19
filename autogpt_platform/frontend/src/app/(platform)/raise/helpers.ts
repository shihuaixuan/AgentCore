import type { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import type { VoiceSample } from "@/app/api/__generated__/models/voiceSample";
import { legacyCategoryForRole } from "./legacyCategory";
import { creditsToUsdLabel } from "@/lib/credits";
import {
  buildVoicePreferences,
  type VoicePickResult,
} from "@/components/organisms/VoicePicker/helpers";
import {
  categoryForRole,
  colorForCategory,
} from "./components/CategoryStep/helpers";

export type RaiseStep =
  | "category"
  | "jobTitle"
  | "avatar"
  | "about"
  | "voice"
  | "budget"
  | "marketplace"
  | "skills"
  | "done";

export const STEP_ORDER: RaiseStep[] = [
  "category",
  "jobTitle",
  "avatar",
  "about",
  "voice",
  "budget",
  "marketplace",
  "skills",
  "done",
];

export interface RaiseAttachmentDraft {
  kind: "workflow" | "skill";
  source: "marketplace" | "library";
  id: string;
  name: string;
  marketplaceKey?: string;
}

export interface RaiseKit {
  weeklyBudget: number | null;
  attachments: RaiseAttachmentDraft[];
}

export const VOICE_SAMPLES: VoiceSample[] = [
  {
    label: "Concise and direct",
    text: "Here's what I found and what I'd do next. No fluff — just the decision and the reason behind it.",
  },
  {
    label: "Warm and detailed",
    text: "I dug into this for you and want to walk you through what stood out, why it matters, and where I think we should head together.",
  },
];

export const RAISE_PROMPTS = {
  greeting: "Hello, I'm Otto. I'll help you create your own AI Expert.",
  categoryQuestion:
    "First — which area should your expert work in? It sets their color.",
  jobTitleQuestion: "And what's their job title?",
  avatarQuestion: (title: string) =>
    `Here's an avatar for ${title}. Use it, generate another, or upload a picture.`,
  aboutQuestion: (title: string) =>
    `Anything else I should know about ${title}? How they should work, what matters to you — or skip it.`,
  voiceQuestion: (title: string) =>
    `How should ${title} sound when they write? Pick the one that feels right.`,
  budgetQuestion: (title: string) =>
    `How much weekly budget should ${title} have? $5 a week is the default — pick an amount, or skip.`,
  marketplaceQuestion: (title: string) =>
    `Want ${title} to run workflows? Search the marketplace and your library, then add any you like — or skip.`,
  skillsQuestion: (title: string) =>
    `Should ${title} have extra skills? Add one from the marketplace or your own library — or skip.`,
};

// Beat before each question lands, so the control that triggered it settles
// into its new state first.
export const PROMPT_DELAY_MS = 500;

export const VOICE_SKIPPED_LABEL = "I'll decide the voice later";

export interface RaiseDraft {
  step: RaiseStep;
  hasStarted: boolean;
  // Answers the color and the role too: every category owns one of each.
  category: ExpertAvatarRequestCategory | null;
  legacyRole?: string;
  color: string | null;
  jobTitle: string | null;
  // "" once the user skips, so the question is not asked again on restore.
  avatarUrl: string | null;
  about: string | null;
  voicePreferences: string;
  voiceLabel: string | null;
  // Outer null = not answered yet. credits null = skipped (platform default).
  budget: { credits: number | null } | null;
  marketplace: RaiseAttachmentDraft[] | null;
  skills: RaiseAttachmentDraft[] | null;
}

export const EMPTY_DRAFT: RaiseDraft = {
  step: "category",
  hasStarted: false,
  category: null,
  color: null,
  jobTitle: null,
  avatarUrl: null,
  about: null,
  voicePreferences: "",
  voiceLabel: null,
  budget: null,
  marketplace: null,
  skills: null,
};

const DRAFT_STORAGE_KEY = "raise-expert-draft";

export function loadDraft(): RaiseDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    const {
      role,
      name: _legacyName,
      ...parsed
    } = JSON.parse(raw) as StoredDraft;
    if (role && !categoryForRole(role)) parsed.legacyRole = role;
    const step = migrateStep(parsed.step);
    const draft = {
      ...EMPTY_DRAFT,
      ...parsed,
      step: isRaiseStep(step) ? step : EMPTY_DRAFT.step,
    };
    const restored = role ? backfillCategory(draft, role) : draft;
    return backfillSkippedVoice(backfillSkippedJobTitle(restored));
  } catch {
    return EMPTY_DRAFT;
  }
}

type StoredDraft = Omit<Partial<RaiseDraft>, "step"> & {
  step?: string;
  role?: string | null;
  name?: string;
};

// Steps that existed in earlier builds map onto the beat that absorbed them,
// so a restored draft resumes where it left off instead of resetting.
function migrateStep(step: string | undefined): string | undefined {
  if (step === "kit") return "budget";
  if (step === "name" || step === "color") return "avatar";
  if (step === "role") return "category";
  return step;
}

// A draft started on the role question takes the category its role implies,
// so it never waits on an area it was not asked for. One parked on the area
// beat, which used to follow the name, moves on to the avatar.
function backfillCategory(draft: RaiseDraft, role: string): RaiseDraft {
  if (draft.category !== null) return draft;
  const category = categoryForRole(role) ?? legacyCategoryForRole(role);
  return {
    ...draft,
    hasStarted: true,
    category,
    color: draft.color ?? colorForCategory(category),
    step: draft.step === "category" ? "avatar" : draft.step,
  };
}

function backfillSkippedJobTitle(draft: RaiseDraft): RaiseDraft {
  if (draft.jobTitle !== null) {
    return { ...draft, jobTitle: draft.jobTitle.trim() };
  }
  if (STEP_ORDER.indexOf(draft.step) <= STEP_ORDER.indexOf("jobTitle")) {
    return draft;
  }
  return { ...draft, jobTitle: "" };
}

// A draft written by an earlier build recorded a skipped voice as a null
// label. The flow now treats null as "not answered", which would leave a
// restored session parked on the voice beat with no way forward, so a draft
// that has already moved past voice gets the sentinel back.
function backfillSkippedVoice(draft: RaiseDraft): RaiseDraft {
  if (draft.voiceLabel !== null) return draft;
  if (STEP_ORDER.indexOf(draft.step) <= STEP_ORDER.indexOf("voice")) {
    return draft;
  }
  return { ...draft, voiceLabel: VOICE_SKIPPED_LABEL };
}

export function saveDraft(draft: RaiseDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Draft persistence is best-effort when storage is blocked or full.
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Clearing is best-effort under the same storage restrictions.
  }
}

function isRaiseStep(step: string | undefined): step is RaiseStep {
  return STEP_ORDER.includes(step as RaiseStep);
}

export function assembledKit(draft: RaiseDraft): RaiseKit | null {
  if (
    draft.budget === null &&
    draft.marketplace === null &&
    draft.skills === null
  ) {
    return null;
  }
  return {
    weeklyBudget: draft.budget?.credits ?? null,
    attachments: [...(draft.marketplace ?? []), ...(draft.skills ?? [])],
  };
}

/** Every field still at its initial value — an untouched wizard, safe to
 *  seed from a link without overwriting work in progress. */
export function isEmptyDraft(draft: RaiseDraft): boolean {
  return (Object.keys(EMPTY_DRAFT) as (keyof RaiseDraft)[]).every(
    (key) => draft[key] === EMPTY_DRAFT[key],
  );
}

/** `/raise?role=…` from the greeting page's raise door: answers the area
 *  beat with the role's category exactly as `pickCategory` would, so the flow
 *  opens on the job title question instead of asking again. */
export function draftWithPrefilledRole(
  draft: RaiseDraft,
  role: string | null,
): RaiseDraft {
  if (!role || !isEmptyDraft(draft)) return draft;
  const category = categoryForRole(role);
  if (!category) return draft;
  return {
    ...draft,
    hasStarted: true,
    category,
    color: colorForCategory(category),
    step: "jobTitle",
  };
}

export function voiceSummaryLabel(
  result: VoicePickResult,
  samples: VoiceSample[],
): string {
  if (result.choice === "custom") return "My own writing sample";
  const sample = result.choice === "a" ? samples[0] : samples[1];
  return sample?.label ?? "A voice";
}

export function resolveVoicePreferences(
  result: VoicePickResult,
  samples: VoiceSample[],
): string | null {
  return buildVoicePreferences(result, samples);
}

export function raisedIdentity(name: string): string {
  // Keep this preview copy aligned with backend experts_db._raised_identity.
  return `I'm ${name}, an AI Expert created by you. I use your instructions to help with your work.`;
}

export function kitBudgetLabel(
  kit: RaiseKit | null,
  translate: (english: string, chinese: string) => string = (english) =>
    english,
): string | null {
  if (!kit || kit.weeklyBudget === null) return null;
  if (kit.weeklyBudget === 0)
    return translate("No weekly limit", "不设每周上限");
  return translate(
    `${creditsToUsdLabel(kit.weeklyBudget)} / week`,
    `${creditsToUsdLabel(kit.weeklyBudget)} / 周`,
  );
}

export function kitToolsLabel(kit: RaiseKit | null): string | null {
  if (!kit || kit.attachments.length === 0) return null;
  return kit.attachments.map((attachment) => attachment.name).join(", ");
}

export function getExpertLimitCode(response: unknown): string | null {
  if (!response || typeof response !== "object" || !("detail" in response)) {
    return null;
  }
  const detail = response.detail;
  if (!detail || typeof detail !== "object" || !("code" in detail)) {
    return null;
  }
  return typeof detail.code === "string" ? detail.code : null;
}
