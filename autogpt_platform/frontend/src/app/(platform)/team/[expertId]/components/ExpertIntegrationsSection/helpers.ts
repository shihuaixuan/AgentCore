import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ExpertCredentialRef } from "@/app/api/__generated__/models/expertCredentialRef";

export type ExistingConnection = CredentialsMetaResponse & {
  customConnections?: ConnectionResponse[];
};

export type GrantedConnection = ExpertCredentialRef & {
  customConnections?: ConnectionResponse[];
};

export function attachCustomConnections<
  T extends CredentialsMetaResponse | ExpertCredentialRef,
>(credential: T, connections: ConnectionResponse[]) {
  const credentialID =
    "id" in credential ? credential.id : credential.credential_id;
  const customConnections = connections.filter(
    (connection) => connection.credential_id === credentialID,
  );
  if (customConnections.length === 0)
    return { ...credential, customConnections: undefined };
  const name = customConnections
    .map((connection) => connection.name)
    .join(" / ");
  return {
    ...credential,
    title: name,
    service: `custom_mcp:${credentialID}`,
    service_name: name,
    customConnections,
  };
}

export function isConnectionEnabled(connection: {
  customConnections?: ConnectionResponse[];
}) {
  return (
    !connection.customConnections ||
    connection.customConnections.some((custom) => custom.enabled !== false)
  );
}

export function connectionSearchText(connection: {
  title: string | null;
  provider: string;
  service_name?: string | null;
  host?: string | null;
  customConnections?: ConnectionResponse[];
}) {
  return [
    connection.title,
    connection.provider,
    connection.service_name,
    connection.host,
    ...(connection.customConnections ?? []).flatMap((custom) => [
      custom.name,
      custom.description,
      custom.server_url,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}
