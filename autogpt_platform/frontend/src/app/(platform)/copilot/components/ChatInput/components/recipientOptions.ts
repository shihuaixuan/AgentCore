import type { ExpertIdentity } from "../../../useExpertMap";

export interface RecipientOption {
  id: string;
  name: string;
  avatarUrl: string | null;
  color?: string | null;
  role?: string | null;
}

export interface RecipientPickerConfig {
  recipient: RecipientOption | null;
  options: RecipientOption[];
  onSelect?: (id: string | null) => void;
  isLoading?: boolean;
  isRosterPending?: boolean;
  hasRosterFailed?: boolean;
}

export function expertRecipient(expert: ExpertIdentity): RecipientOption {
  return {
    id: expert.id,
    name: expert.name,
    avatarUrl: expert.avatarUrl,
    color: expert.color,
    role: expert.jobTitle || expert.role,
  };
}

export function recipientOptions(experts: ExpertIdentity[]) {
  return experts.map(expertRecipient);
}

export function newTaskDraftKey(expertId: string | null) {
  return `new:${expertId ?? "default"}`;
}
