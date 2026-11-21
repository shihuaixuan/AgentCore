import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { AuthMethod } from "./endpointAuth";
import type { useCustomMCPForm } from "./useCustomMCPForm";

export function EndpointFields({
  state,
}: {
  state: ReturnType<typeof useCustomMCPForm>;
}) {
  const { t } = useTranslation();
  const { auth_type: method, server_url: url } = state.form;
  const labels: Record<AuthMethod, string> = {
    none: t("None", "无需认证"),
    oauth: "OAuth",
    bearer: "Bearer",
    basic: "Basic",
    header: t("Custom header", "自定义请求头"),
    query_key: t("Query credential", "查询参数凭据"),
  };
  const hasSecretURL = state.fields.some(
    (field) => field.type === "secret_url",
  );

  return (
    <>
      <Input
        id="custom-mcp-url"
        label={t("Server URL or credential URL", "服务器地址或凭据链接")}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={url}
        onChange={(event) => state.changeURL(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          const input = event.currentTarget;
          const pasted = event.clipboardData.getData("text/plain");
          state.changeURL(
            /^https?:\/\//i.test(pasted.trim())
              ? pasted
              : url.slice(0, input.selectionStart ?? 0) +
                  pasted +
                  url.slice(input.selectionEnd ?? url.length),
          );
        }}
      />
      {state.rejectedURL && (
        <Text variant="small" role="alert">
          {t(
            "This URL was not accepted. Paste a clean HTTPS endpoint or a supported credential link.",
            "未接受此地址。请粘贴纯 HTTPS 地址或受支持的凭据链接。",
          )}
        </Text>
      )}
      {url &&
        (state.manual && !state.manualOpen ? (
          <Button variant="secondary" onClick={() => state.setManualOpen(true)}>
            {t("Configure authentication manually", "手动配置身份验证")}
          </Button>
        ) : state.choices.length === 1 && method ? (
          <Text variant="small">
            {t("Authentication", "身份验证")}: {labels[method]}
          </Text>
        ) : (
          <Select
            id="custom-mcp-auth"
            label={t("Authentication", "身份验证")}
            placeholder={t(
              "Choose an authentication method",
              "请选择身份验证方式",
            )}
            value={method ?? ""}
            onValueChange={(value) => {
              const choice = state.choices.find((item) => item === value);
              if (choice) state.choose(choice);
            }}
            options={state.choices.map((value) => ({
              value,
              label: labels[value],
            }))}
          />
        ))}
      {state.needsEndpoint ? (
        <Text variant="small" role="status">
          {t(
            "Replace the server URL with the endpoint supplied by the service.",
            "请将服务器地址替换为服务商提供的服务端点。",
          )}
        </Text>
      ) : (
        method &&
        method !== "none" &&
        method !== "oauth" &&
        (hasSecretURL ? (
          state.fields.map((field) => (
            <Input
              key={`${url}:${field.id}`}
              id={`custom-mcp-field-${field.id}`}
              label={field.label}
              type={field.type === "text" ? "text" : "password"}
              autoComplete="off"
              value={state.fieldValues[field.id] ?? ""}
              onChange={(event) =>
                state.setFieldValue(field.id, event.target.value)
              }
            />
          ))
        ) : (
          <>
            {state.fields
              .filter((field) => field.type === "text")
              .map((field) => (
                <Input
                  key={`${url}:${field.id}`}
                  id={`custom-mcp-field-${field.id}`}
                  label={field.label}
                  value={state.fieldValues[field.id] ?? ""}
                  onChange={(event) =>
                    state.setFieldValue(field.id, event.target.value)
                  }
                />
              ))}
            <Input
              key={`${url}:${method}`}
              id="custom-mcp-token"
              label={
                method === "header" && state.authParameter
                  ? `${state.authParameter} credential`
                  : t("Credential", "凭据")
              }
              type="password"
              autoComplete="off"
              value={state.token}
              onChange={(event) => state.setToken(event.target.value)}
            />
          </>
        ))
      )}
    </>
  );
}
