"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { Button } from "@/components/atoms/Button/Button";
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons";
import { withoutDuplicateKeyMethod, type AuthMethod } from "../../helpers";
import { MCPPresetPanel } from "./MCPPresetPanel";

interface Props {
  catalogID?: string;
  serviceName: string;
  server: NonNullable<ProviderMetadata["mcp_server"]>;
  /** The vendor's block credential methods, if it also ships any. */
  nativeMethods: AuthMethod[];
  onUseNative: () => void;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
  /** Puts a Back button beside Connect, for hosts without a header arrow. */
  onBack?: () => void;
}

/** The service's own sign-in, shown first, with the block credential one
 *  click away when the vendor also ships one. */
export function McpFirstPanel({
  catalogID,
  server,
  serviceName,
  nativeMethods,
  onUseNative,
  onSuccess,
  onBack,
}: Props) {
  const { t } = useTranslation();

  return (
    <MCPPresetPanel
      catalogID={catalogID}
      serviceName={serviceName}
      server={withoutDuplicateKeyMethod(server, nativeMethods)}
      onSuccess={onSuccess}
      actions={
        <>
          {nativeMethods.length > 0 ? (
            <Button
              variant="ghost"
              size="small"
              className="mr-auto"
              leadingIcon={MoreHorizontalCircle01Icon}
              onClick={onUseNative}
            >
              {t("More ways to connect", "更多连接方式")}
            </Button>
          ) : null}
          {onBack ? (
            <Button variant="secondary" size="small" onClick={onBack}>
              {t("Back", "返回")}
            </Button>
          ) : null}
        </>
      }
    />
  );
}
