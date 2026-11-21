import type { BlockInfo } from "@/app/api/__generated__/models/blockInfo";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import { Block } from "../Block";

const PAGE_SIZE = 8;

export function LocalizedBlockMatches({
  blocks,
  query,
}: {
  blocks: BlockInfo[];
  query: string;
}) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(PAGE_SIZE);
  return (
    <section className="space-y-2.5">
      <Text variant="body-medium">
        {t(
          `Chinese block matches (${blocks.length})`,
          `中文模块匹配（${blocks.length}）`,
        )}
      </Text>
      {blocks.slice(0, limit).map((block) => (
        <Block key={block.id} blockData={block} highlightedText={query} />
      ))}
      {limit < blocks.length && (
        <Button
          variant="link"
          size="small"
          onClick={() => setLimit(limit + PAGE_SIZE)}
        >
          {t("Show more matches", "显示更多匹配模块")}
        </Button>
      )}
    </section>
  );
}
