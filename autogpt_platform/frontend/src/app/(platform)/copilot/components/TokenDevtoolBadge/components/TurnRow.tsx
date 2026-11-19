import {
  formatTokenCount,
  turnInputTokens,
  type TokenTurn,
} from "../../../tokenDevtool/tokenMath";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  index: number;
  turn: TokenTurn;
}

export function TurnRow({ index, turn }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline gap-2 font-mono text-caption">
      <span className="w-6 shrink-0 text-foreground-tertiary">
        #{index + 1}
      </span>
      {turn.compacted && (
        <span className="text-warning">
          <span aria-hidden>⟲</span>
          <span className="sr-only">
            {t("transcript summarized this turn", "本轮已对对话记录进行摘要")}
          </span>
        </span>
      )}
      <span className="text-foreground-emphasis">
        {t("in", "输入")} {formatTokenCount(turnInputTokens(turn))}
      </span>
      <span className="text-foreground-tertiary">
        {t("out", "输出")} {formatTokenCount(turn.completionTokens)}
      </span>
      <span className="ml-auto text-foreground-subtle">
        {t("w", "缓存写入")} {formatTokenCount(turn.cacheCreationTokens)}
      </span>
    </div>
  );
}
