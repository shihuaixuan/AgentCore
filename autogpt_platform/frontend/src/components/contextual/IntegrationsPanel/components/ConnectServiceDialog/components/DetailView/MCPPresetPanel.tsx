"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { useContext, type ReactNode } from "react";
import { hasCatalogMethods } from "@/lib/mcp-catalog-connections";
import { CatalogAccountPanel } from "../../../CatalogAccounts/CatalogAccountPanel";
import { CatalogAccountScope } from "../../../CatalogAccounts/CatalogAccountScope";
import {
  TabsLine,
  TabsLineList,
  TabsLineTrigger,
  TabsLineContent,
} from "@/components/molecules/TabsLine/TabsLine";
import { McpConnectPanel } from "./McpConnectPanel";
import { PublicMCPPanel } from "./PublicMCPPanel";
import { QueryCredentialPanel } from "./QueryCredentialPanel";
import { UnsupportedNotice } from "./UnsupportedNotice";

type AuthMethod = NonNullable<
  NonNullable<ProviderMetadata["mcp_server"]>["auth_methods"]
>[number];

const METHOD_LABELS: Record<AuthMethod, [string, string]> = {
  none: ["No sign-in", "无需登录"],
  oauth: ["Sign in", "登录"],
  bearer: ["API token", "API 令牌"],
  basic: ["Basic authentication", "基本身份验证"],
  header: ["Custom header", "自定义请求头"],
  query_key: ["API Key URL", "API Key 链接"],
};

interface Props {
  catalogID?: string;
  serviceName: string;
  server: NonNullable<ProviderMetadata["mcp_server"]>;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
  /** Extra buttons for the row that holds Connect. */
  actions?: ReactNode;
}

export function MCPPresetPanel({
  catalogID,
  server,
  serviceName,
  onSuccess,
  actions,
}: Props) {
  const { t } = useTranslation();
  const scope = useContext(CatalogAccountScope);
  if (catalogID && hasCatalogMethods(server)) {
    return (
      <>
        <CatalogAccountPanel
          key={JSON.stringify([
            catalogID,
            server.definition_version,
            scope.expertID,
          ])}
          connectorID={catalogID}
          server={server}
          expertID={scope.expertID}
          onDone={(row) => {
            if (scope.onAccount) scope.onAccount(row);
            else onSuccess();
          }}
        />
        {actions}
      </>
    );
  }

  const methods = server.auth_methods ?? [];
  return (
    <div className="flex flex-col gap-4">
      <Text variant="body" tone="secondary">
        {server.setup_instructions}
      </Text>
      <Link href={server.documentation_url} isExternal variant="secondary">
        {t("Official documentation", "官方文档")}
      </Link>
      {methods.length === 1 ? (
        <PresetMethod
          catalogID={catalogID}
          serviceName={serviceName}
          server={server}
          onSuccess={onSuccess}
          method={methods[0]}
          actions={actions}
        />
      ) : (
        <TabsLine defaultValue={methods[0]}>
          <TabsLineList aria-label={t("Connection method", "连接方式")}>
            {methods.map((method) => (
              <TabsLineTrigger key={method} value={method}>
                {t(...METHOD_LABELS[method])}
              </TabsLineTrigger>
            ))}
          </TabsLineList>
          {methods.map((method) => (
            <TabsLineContent key={method} value={method}>
              <PresetMethod
                catalogID={catalogID}
                serviceName={serviceName}
                server={server}
                onSuccess={onSuccess}
                method={method}
                actions={actions}
              />
            </TabsLineContent>
          ))}
        </TabsLine>
      )}
    </div>
  );
}

function PresetMethod({
  catalogID,
  server,
  serviceName,
  onSuccess,
  method,
  actions,
}: Props & { method: AuthMethod }) {
  if (method === "query_key") {
    return catalogID ? (
      <QueryCredentialPanel
        key={catalogID}
        catalogID={catalogID}
        server={server}
        serviceName={serviceName}
        onSuccess={onSuccess}
        actions={actions}
      />
    ) : null;
  }
  if (method === "none") {
    return server.server_url ? (
      <PublicMCPPanel serverURL={server.server_url} actions={actions} />
    ) : null;
  }
  if (method === "header") {
    return <UnsupportedNotice providerName={serviceName} />;
  }
  return (
    <McpConnectPanel
      onSuccess={onSuccess}
      initialServerURL={
        (method === "oauth" ? server.oauth_server_url : null) ??
        server.server_url ??
        ""
      }
      lockServerURL={
        server.connection_mode === "hosted" && !server.allow_custom_url
      }
      allowedAuthMethods={[method]}
      oauthScopes={server.oauth_scopes}
      oauthWriteScopes={server.oauth_write_scopes}
      serverURLOptions={server.server_url_options}
      actions={actions}
    />
  );
}
