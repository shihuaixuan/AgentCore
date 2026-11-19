"use client";

import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getManagedIdentity } from "@/components/molecules/ExpertAvatar/helpers";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, type ComponentProps } from "react";

type Props = ComponentProps<typeof ExpertAvatar>;

export function MarketplaceExpertAvatar(props: Props) {
  const identity = getManagedIdentity(props.avatarUrl);
  if (
    !identity ||
    identity.id === "otto" ||
    identity.id === "expert-general-01"
  ) {
    return <ExpertAvatar {...props} />;
  }

  const src = `/experts/professional/${identity.id}.webp`;
  return <ProfessionalPortrait key={src} src={src} {...props} />;
}

function ProfessionalPortrait({
  src,
  size = 48,
  ...props
}: Props & { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ExpertAvatar size={size} {...props} />;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn(
        "aspect-square shrink-0 rounded-xl object-cover",
        props.className,
      )}
    />
  );
}
