import { useState } from "react";
import { useGetV1ListProviders } from "@/app/api/__generated__/endpoints/integrations/integrations";
import type { ConnectionResponse } from "@/app/api/__generated__/models/connectionResponse";
import {
  type AuthMethod,
  endpointAuthOptions,
  isCleanServerURL,
  manualMethods,
  readServerInput,
} from "./endpointAuth";

const blank = {
  name: "",
  description: "",
  enabled: true,
  server_url: "",
  credential_id: null as string | null,
};

export function useCustomMCPForm(open: boolean) {
  const catalog = useGetV1ListProviders({ query: { enabled: open } });
  const [fields, setFields] = useState(blank);
  const [secret, setSecret] = useState<{
    method: AuthMethod;
    value: string;
  } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [selected, setSelected] = useState<AuthMethod | null>(null);
  const [legacy, setLegacy] = useState<AuthMethod | null>(null);
  const [rejectedURL, setRejectedURL] = useState(false);
  const options = endpointAuthOptions(
    fields.server_url,
    catalog.data?.data ?? [],
  );
  const manual = !options.length;
  const methods = manual ? manualMethods : options.map(({ method }) => method);
  const choices =
    legacy && !methods.includes(legacy) ? [...methods, legacy] : methods;
  const preferred = options.find(
    (option) => option.endpoint === fields.server_url,
  );
  const method =
    selected && choices.includes(selected)
      ? selected
      : (preferred?.method ?? null);
  const needsEndpoint =
    method !== legacy &&
    options.some(
      (option) =>
        option.method === method && option.endpoint !== fields.server_url,
    );
  const token = secret && secret.method === method ? secret.value : "";

  function reset(connection?: ConnectionResponse) {
    const input = readServerInput(connection?.server_url ?? "");
    setFields(
      connection
        ? {
            name: connection.name,
            description: connection.description ?? "",
            enabled: connection.enabled ?? true,
            server_url: input.serverURL,
            credential_id:
              input.rejected || input.token
                ? null
                : (connection.credential_id ?? null),
          }
        : blank,
    );
    setRejectedURL(input.rejected);
    setLegacy(
      input.token || input.rejected ? null : (connection?.auth_type ?? null),
    );
    setSelected(input.token ? "query_key" : (connection?.auth_type ?? null));
    setSecret(input.token ? { method: "query_key", value: input.token } : null);
    setManualOpen(Boolean(connection));
  }

  function changeURL(raw: string) {
    const input = readServerInput(raw);
    setFields({ ...fields, server_url: input.serverURL, credential_id: null });
    setRejectedURL(input.rejected);
    setSelected(input.token ? "query_key" : null);
    setLegacy(null);
    setSecret(input.token ? { method: "query_key", value: input.token } : null);
    setManualOpen(false);
  }

  function choose(method: AuthMethod) {
    const endpoint = options.find(
      (option) => option.method === method,
    )?.endpoint;
    setFields({
      ...fields,
      server_url:
        endpoint && isCleanServerURL(endpoint) ? endpoint : fields.server_url,
      credential_id: null,
    });
    setSecret(null);
    setSelected(method);
    setLegacy(null);
  }

  function setToken(value: string) {
    if (method) setSecret({ method, value });
  }

  return {
    form: { ...fields, auth_type: method },
    updateFields: (
      updates: Partial<
        Pick<
          typeof fields,
          "name" | "description" | "enabled" | "credential_id"
        >
      >,
    ) => setFields({ ...fields, ...updates }),
    canSave:
      isCleanServerURL(fields.server_url) &&
      Boolean(method) &&
      !needsEndpoint &&
      !rejectedURL,
    choices,
    manual,
    manualOpen,
    setManualOpen,
    needsEndpoint,
    rejectedURL,
    token,
    setToken,
    reset,
    changeURL,
    choose,
  };
}
