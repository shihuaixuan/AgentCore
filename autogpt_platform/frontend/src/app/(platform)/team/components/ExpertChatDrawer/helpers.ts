import type { ExpertKickoffMetadata } from "@/app/(platform)/copilot/expertKickoff";
import type { OutgoingMessage } from "@/app/(platform)/copilot/helpers/sendWithAttachments";
import { Expert } from "@/app/api/__generated__/models/expert";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";

export interface ChatTarget {
  expertId: string | null;
  role: string;
  jobTitle?: string | null;
  avatarUrl: string | null;
  color?: string | null;
}

export const AUTOPILOT_CHAT_TARGET: ChatTarget = {
  expertId: null,
  role: getDefaultAssistantTitle("en"),
  avatarUrl: DEFAULT_ASSISTANT_AVATAR_URL,
};

export function expertToChatTarget(expert: Expert): ChatTarget {
  return {
    expertId: expert.id,
    role: expert.role,
    jobTitle: expert.job_title,
    avatarUrl: expert.avatar_url,
    color: expert.color,
  };
}

export function textMessage(
  text: string,
  metadata?: ExpertKickoffMetadata,
): OutgoingMessage {
  return { text, files: [], parts: [], metadata };
}
