"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { serviceLabelFromIcon } from "@/components/contextual/IntegrationsPanel/helpers";
import Image from "next/image";
import { useState } from "react";

const VISIBLE_LOGOS = 3;

interface Props {
  expertName: string;
  providers: string[];
}

/** The services an expert can reach, as the logos the connections dialog
 *  uses. Each logo says on hover whose account it is; past three, a "+N more"
 *  names the rest. It all sits inside the card link, so nothing is focusable
 *  itself and the hidden names are also given to screen readers inline. */
export function IntegrationIcons({ expertName, providers }: Props) {
  const { t } = useTranslation();
  if (providers.length === 0) return null;
  const shown = providers.slice(0, VISIBLE_LOGOS);
  const hidden = providers.slice(VISIBLE_LOGOS);
  const hiddenNames = hidden.map(serviceLabelFromIcon).join(", ");

  return (
    <ul
      aria-label={t("Integrations", "集成")}
      className="flex shrink-0 items-center gap-1"
    >
      {shown.map((provider) => (
        <li key={provider} className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex">
                <ProviderLogo provider={provider} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t(
                `${expertName} has access to your ${serviceLabelFromIcon(provider)} account`,
                `${expertName} 可以访问你的 ${serviceLabelFromIcon(provider)} 账户`,
              )}
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
      {hidden.length > 0 ? (
        <li className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Text
                variant="body-medium"
                as="span"
                tone="emphasis"
                className="cursor-default whitespace-nowrap"
              >
                {t(`+${hidden.length} more`, `另有 ${hidden.length} 项`)}
                <span className="sr-only">: {hiddenNames}</span>
              </Text>
            </TooltipTrigger>
            <TooltipContent>{hiddenNames}</TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}

interface LogoProps {
  provider: string;
}

function ProviderLogo({ provider }: LogoProps) {
  const [isBroken, setIsBroken] = useState(false);
  const name = serviceLabelFromIcon(provider);

  if (isBroken) {
    return (
      <span
        role="img"
        aria-label={name}
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-tiny leading-none font-semibold text-foreground-secondary uppercase ring-1 ring-border-base"
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface p-0.5 ring-1 ring-border-base">
      <Image
        src={`/integrations/${provider}.png`}
        alt={name}
        width={14}
        height={14}
        loading="lazy"
        className="size-full object-contain"
        onError={() => setIsBroken(true)}
      />
    </span>
  );
}
