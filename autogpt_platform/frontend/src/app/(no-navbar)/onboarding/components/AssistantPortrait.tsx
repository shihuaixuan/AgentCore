import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";

export function AssistantPortrait({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const { locale } = useTranslation();
  return (
    <Image
      src={DEFAULT_ASSISTANT_AVATAR_URL}
      alt={getDefaultAssistantTitle(locale)}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn("shrink-0 rounded-xl object-cover", className)}
    />
  );
}
