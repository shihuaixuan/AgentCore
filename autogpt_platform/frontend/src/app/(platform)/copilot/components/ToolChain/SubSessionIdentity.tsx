"use client";

import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  name: string;
  avatarUrl: string | null;
  color?: string | null;
  role: string | null;
  size: number;
}

export function SubSessionIdentity({
  name,
  avatarUrl,
  color,
  role,
  size,
}: Props) {
  return (
    <>
      <ExpertAvatar name={name} avatarUrl={avatarUrl} color={color} size={size} />
      <div className="min-w-0 flex-1">
        <Text
          variant="body-sm-medium-inherit"
          tone="emphasis"
          className="truncate"
        >
          {name}
        </Text>
        {role && (
          <Text variant="small-tight" tone="subtle" className="truncate">
            {role}
          </Text>
        )}
      </div>
    </>
  );
}
