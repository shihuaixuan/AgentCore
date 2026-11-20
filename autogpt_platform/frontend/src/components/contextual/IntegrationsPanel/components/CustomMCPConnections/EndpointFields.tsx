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
    query_key: t("Query key", "查询密钥"),
  };
  return (
    <>
      <Input
        id="custom-mcp-url"
        label={t("Server URL", "服务器地址")}
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
            "This URL was not accepted. Paste a clean HTTPS endpoint or a DingTalk server link with a single key.",
            "未接受此地址。请粘贴纯 HTTPS 地址，或仅含一个 key 参数的钉钉服务器链接。",
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
            "Replace the server URL with the key-based endpoint supplied by DingTalk (/server/<id>).",
            "请将服务器地址替换为钉钉提供的密钥地址（/server/<id>）。",
          )}
        </Text>
      ) : (
        (method === "query_key" ||
          method === "bearer" ||
          method === "basic") && (
          <Input
            key={`${url}:${method}`}
            id="custom-mcp-token"
            label={t("Credential", "凭据")}
            type="password"
            autoComplete="off"
            value={state.token}
            onChange={(event) => state.setToken(event.target.value)}
          />
        )
      )}
    </>
  );
}
