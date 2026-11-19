import { ExpertAvatar as SharedExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  avatarUrl: string | null;
  color?: string | null;
  /** Identity still loading: a muted grey circle, no stand-in identity. */
  isLoading?: boolean;
  size?: "sm" | "md";
}

export function ExpertAvatar({
  name,
  avatarUrl,
  color,
  isLoading,
  size,
}: Props) {
  const isSmall = size === "sm";
  const sizeClass = isSmall ? "h-6 w-6" : "h-9 w-9";

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className={cn("shrink-0 rounded-full bg-surface-hover", sizeClass)}
      />
    );
  }

  return (
    <SharedExpertAvatar
      name={name}
      avatarUrl={avatarUrl}
      color={color}
      size={isSmall ? 24 : 36}
      className="rounded-lg border border-border-base"
    />
  );
}
