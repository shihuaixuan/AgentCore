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
  const [values, setValues] = useState<Record<string, string>>({});
  const [manualAuthParameter, setManualAuthParameter] = useState<string>();
  const [manualOpen, setManualOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<AuthMethod | null>(null);
  const [rejectedURL, setRejectedURL] = useState(false);
  const providers = catalog.data?.data ?? [];
  const options = endpointAuthOptions(fields.server_url, providers);
  const manual = !options.length;
  const methods = manual ? manualMethods : options.map(({ method }) => method);
  const choices =
    legacy && !methods.includes(legacy) ? [...methods, legacy] : methods;
  const selectedOption =
    options.find((option) => option.methodID === selected) ??
    options.find((option) => option.method === selected) ??
    options.find((option) => option.endpoint === fields.server_url) ??
    options[0];
  const method =
    selectedOption?.method ??
    (selected && choices.includes(selected as AuthMethod)
      ? (selected as AuthMethod)
      : null);
  const needsEndpoint =
    method !== legacy &&
    method !== "oauth" &&
    options.some(
      (option) =>
        option.method === method &&
        option.endpoint !== null &&
        option.endpoint !== fields.server_url,
    );
  const secretField = selectedOption?.fields?.find(
    (field) => field.type !== "text",
  );
  const credentialField =
    secretField ??
    (method && method !== "none" && method !== "oauth"
      ? { id: "token", type: "secret" as const }
      : undefined);
  const token = credentialField ? (values[credentialField.id] ?? "") : "";
  const fieldsReady = selectedOption?.fields
    ? Boolean(fields.credential_id) ||
      selectedOption.fields.every((field) => Boolean(values[field.id]?.trim()))
    : method === "none" || method === "oauth" || Boolean(token.trim());

  function reset(connection?: ConnectionResponse) {
    const input = readServerInput(connection?.server_url ?? "", providers);
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
    setManualAuthParameter(input.authParameter);
    setLegacy(
      input.token || input.rejected ? null : (connection?.auth_type ?? null),
    );
    setSelected(
      input.methodID ??
        connection?.method_id ??
        (input.token ? "query_key" : (connection?.auth_type ?? null)),
    );
    setValues(
      input.values ?? (input.token ? { token: input.token } : {}),
    );
    setManualOpen(Boolean(connection));
  }

  function changeURL(raw: string) {
    const input = readServerInput(raw, providers);
    setFields({ ...fields, server_url: input.serverURL, credential_id: null });
    setRejectedURL(input.rejected);
    setManualAuthParameter(input.authParameter);
    setSelected(
      input.methodID ?? (input.token ? "query_key" : null),
    );
    setLegacy(null);
    setValues(
      input.values ?? (input.token ? { token: input.token } : {}),
    );
    setManualOpen(Boolean(input.token || input.authParameter || input.methodID));
  }

  function choose(nextMethod: AuthMethod) {
    const option = options.find((item) => item.method === nextMethod);
    const endpoint = option?.endpoint;
    setFields({
      ...fields,
      server_url:
        endpoint && isCleanServerURL(endpoint) ? endpoint : fields.server_url,
      credential_id: null,
    });
    setValues({});
    setManualAuthParameter(undefined);
    setSelected(option?.methodID ?? nextMethod);
    setLegacy(null);
  }

  function setToken(value: string) {
    if (credentialField) setValues({ ...values, [credentialField.id]: value });
  }

  function setFieldValue(fieldID: string, value: string) {
    setValues({ ...values, [fieldID]: value });
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
      fieldsReady &&
      !rejectedURL,
    choices,
    manual,
    manualOpen,
    setManualOpen,
    needsEndpoint,
    rejectedURL,
    token,
    fieldValues: values,
    catalogValues: selectedOption?.fields?.length ? values : undefined,
    authParameter: selectedOption?.authParameter ?? manualAuthParameter,
    authPrefix: selectedOption?.authPrefix,
    authEndpoint: selectedOption?.authEndpoint,
    catalogID: selectedOption?.catalogID,
    methodID: selectedOption?.methodID,
    toolEndpoint:
      selectedOption?.toolEndpoint ?? selectedOption?.endpoint ?? fields.server_url,
    fixedParams: selectedOption?.fixedParams,
    fields: selectedOption?.fields ?? [],
    usesCompleteURL: Boolean(
      selectedOption?.fields?.some((field) => field.type === "secret_url"),
    ),
    setToken,
    setFieldValue,
    reset,
    changeURL,
    choose,
  };
}
