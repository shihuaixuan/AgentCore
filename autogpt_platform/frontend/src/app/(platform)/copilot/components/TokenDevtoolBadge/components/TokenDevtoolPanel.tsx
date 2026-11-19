import {
  AUTOCOMPACT_TOKENS,
  MODEL_CONTEXT_WINDOW,
  formatTokenCount,
} from "../../../tokenDevtool/tokenMath";
import type { useTokenDevtoolBadge } from "../useTokenDevtoolBadge";
import { BreakdownSection } from "./BreakdownSection";
import { ContextBar } from "./ContextBar";
import { TurnRow } from "./TurnRow";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type Props = ReturnType<typeof useTokenDevtoolBadge>;

export function TokenDevtoolPanel({ turns, breakdown, context }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-baseline justify-between pb-2">
        <Text variant="body-medium-tight" as="span" tone="emphasis">
          {t("Context window", "上下文窗口")}
        </Text>
        <Text variant="small-mono-tight" as="span" tone="muted">
          {context === null ? "—" : `~${formatTokenCount(context)}`} /{" "}
          {formatTokenCount(MODEL_CONTEXT_WINDOW)}
        </Text>
      </div>
      <ContextBar context={context ?? 0} />
      <p className="pt-1 font-mono text-tiny leading-inherit text-foreground-subtle">
        {t(
          `assumes a ${formatTokenCount(MODEL_CONTEXT_WINDOW)} window; the backend threshold is configurable`,
          `按 ${formatTokenCount(MODEL_CONTEXT_WINDOW)} 的窗口估算；后端阈值可配置`,
        )}
      </p>
      <p className="pt-0.5 pb-2.5 text-right font-mono text-caption text-warning">
        {t(
          `summarizes ~${formatTokenCount(AUTOCOMPACT_TOKENS)}`,
          `约 ${formatTokenCount(AUTOCOMPACT_TOKENS)} 时进行摘要`,
        )}
      </p>

      {breakdown && <BreakdownSection breakdown={breakdown} />}

      {!turns?.length ? (
        <p className="text-body text-foreground-tertiary">
          {t(
            "Live per-turn data starts with your next message.",
            "从你的下一条消息开始显示每轮实时数据。",
          )}
        </p>
      ) : (
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {turns.map((turn, i) => (
            <TurnRow key={`${turn.at}-${i}`} index={i} turn={turn} />
          ))}
        </div>
      )}
    </>
  );
}
