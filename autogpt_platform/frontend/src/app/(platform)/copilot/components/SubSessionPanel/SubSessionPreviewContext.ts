import { createContext } from "react";

export interface SubSessionPreview {
  sessionID: string;
  name: string;
  avatarURL: string | null;
  color?: string | null;
}

export const SubSessionPreviewContext = createContext<
  ((preview: SubSessionPreview) => void) | null
>(null);
