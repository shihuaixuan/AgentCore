import type { ExpertIdentity } from "../../../useExpertMap";
import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";

export interface RecipientOption {
  id: string;
  name?: string;
  avatarUrl: string | null;
  color?: string | null;
  role?: string | null;
  jobTitle?: string | null;
}

export interface RecipientPickerConfig {
  recipient: RecipientOption | null;
  options: RecipientOption[];
  onSelect?: (id: string | null) => void;
  isLoading?: boolean;
  isRosterPending?: boolean;
  hasRosterFailed?: boolean;
  isThreadPicker?: boolean;
}

export const OTTO_RECIPIENT_OPTION: RecipientOption = {
  id: "otto",
  avatarUrl: null,
};

export function expertRecipient(expert: ExpertIdentity): RecipientOption {
  return {
    id: expert.id,
    avatarUrl: expert.avatarUrl,
    color: expert.color,
    role: expert.role,
    jobTitle: expert.jobTitle,
  };
}

export function recipientTitle(option: RecipientOption, locale: Locale) {
  return option === OTTO_RECIPIENT_OPTION
    ? AUTOPILOT_NAME
    : getExpertDisplayTitle(option, locale);
}

export function recipientChoices(options: RecipientOption[], locale: Locale) {
  const choices = options.map((option) => ({
    option,
    title: recipientTitle(option, locale),
  }));
  const idsByTitle = new Map<string, string[]>();
  for (const { option, title } of choices) {
    const ids = idsByTitle.get(title) ?? [];
    ids.push(option.id);
    idsByTitle.set(title, ids);
  }
  for (const ids of idsByTitle.values()) {
    ids.sort();
  }
  return choices.map(({ option, title }) => {
    const ids = idsByTitle.get(title);
    const number = ids && ids.length > 1 ? ids.indexOf(option.id) + 1 : null;
    return {
      option,
      title,
      label:
        number === null
          ? title
          : locale === "zh-CN"
            ? `${title}（${number}）`
            : `${title} (${number})`,
    };
  });
}

export function recipientOptions(experts: ExpertIdentity[]) {
  return experts.map(expertRecipient);
}

export function newTaskDraftKey(expertId: string | null) {
  return `new:${expertId ?? "default"}`;
}
