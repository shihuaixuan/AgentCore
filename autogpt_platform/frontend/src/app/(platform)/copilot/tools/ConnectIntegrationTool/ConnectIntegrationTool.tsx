"use client";

import type { SetupRequirementsResponse } from "@/app/api/__generated__/models/setupRequirementsResponse";
import type { ToolUIPart } from "ai";
import { MorphingTextAnimation } from "../../components/MorphingTextAnimation/MorphingTextAnimation";
import { SetupRequirementsCard } from "../../components/SetupRequirementsCard/SetupRequirementsCard";
import {
  isUnparseableJsonOutput,
  reportCorruptedToolOutput,
} from "../../helpers/toolOutput";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type Props = {
  part: ToolUIPart;
};

function parseJson(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function parseOutput(raw: unknown): SetupRequirementsResponse | null {
  const parsed = parseJson(raw);
  if (parsed && typeof parsed === "object" && "setup_info" in parsed) {
    return parsed as SetupRequirementsResponse;
  }
  return null;
}

function parseError(raw: unknown): string | null {
  const parsed = parseJson(raw);
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    return String((parsed as { message: unknown }).message);
  }
  return null;
}

export function ConnectIntegrationTool({ part }: Props) {
  const { t } = useTranslation();
  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";

  const output =
    part.state === "output-available"
      ? parseOutput((part as { output?: unknown }).output)
      : null;

  const isCorrupted =
    part.state === "output-available" &&
    !output &&
    isUnparseableJsonOutput((part as { output?: unknown }).output);
  if (isCorrupted) reportCorruptedToolOutput(part.toolCallId, part.type);

  const isError = part.state === "output-error" || isCorrupted;

  // Only genuine output-error states get the generic failure message; a
  // corrupted payload renders its own dedicated message below.
  const errorMessage =
    part.state === "output-error"
      ? (parseError((part as { output?: unknown }).output) ??
        t("Failed to connect integration", "连接集成失败"))
      : null;

  const rawProvider =
    (part as { input?: { provider?: string } }).input?.provider ?? "";
  const providerName =
    output?.setup_info?.agent_name ??
    // Sanitize LLM-controlled provider slug: trim and cap at 64 chars to
    // prevent runaway text in the DOM.
    (rawProvider ? rawProvider.trim().slice(0, 64) : t("integration", "集成"));

  const label = isStreaming
    ? t(`Connecting ${providerName}…`, `正在连接 ${providerName}…`)
    : isError
      ? t(`Failed to connect ${providerName}`, `连接 ${providerName} 失败`)
      : output
        ? t(
            `Connect ${output.setup_info?.agent_name ?? providerName}`,
            `连接 ${output.setup_info?.agent_name ?? providerName}`,
          )
        : t(`Connect ${providerName}`, `连接 ${providerName}`);

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-body text-foreground-tertiary">
        <MorphingTextAnimation
          text={label}
          className={isError ? "text-error" : undefined}
        />
      </div>

      {isError && errorMessage && (
        <Text variant="body-tight" tone="error" className="mt-1">
          {errorMessage}
        </Text>
      )}

      {isCorrupted && (
        <Text variant="body-tight" tone="error" className="mt-1">
          {t(
            `The sign-in card data arrived corrupted and can't be shown. Ask your expert to retry connecting ${providerName}.`,
            `收到的登录卡片数据已损坏，无法显示。请让你的专家重新尝试连接 ${providerName}。`,
          )}
        </Text>
      )}

      {output && (
        <div className="mt-2">
          <SetupRequirementsCard
            output={output}
            credentialsLabel={t(
              `${output.setup_info?.agent_name ?? providerName} credentials`,
              `${output.setup_info?.agent_name ?? providerName} 凭据`,
            )}
            retryInstruction="I've connected my account. Please continue."
          />
        </div>
      )}
    </div>
  );
}
