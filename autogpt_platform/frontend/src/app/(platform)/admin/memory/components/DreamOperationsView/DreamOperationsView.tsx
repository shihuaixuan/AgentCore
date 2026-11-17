"use client";

import type { DreamOperationsSnapshot } from "@/app/api/__generated__/models/dreamOperationsSnapshot";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/molecules/Accordion/Accordion";
import { Text } from "@/components/atoms/Text/Text";
import { DreamWriteRow } from "./components/DreamWriteRow";
import { DreamDemotionRow } from "./components/DreamDemotionRow";
import { DreamEntityInvalidationRow } from "./components/DreamEntityInvalidationRow";
import { sectionCounts } from "./helpers";
import {
  Alert01Icon,
  BulbIcon,
  Delete02Icon,
  FilePlusIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  operations: DreamOperationsSnapshot | null | undefined;
}

export function DreamOperationsView({ operations }: Props) {
  const { t } = useTranslation();
  if (!operations) {
    return (
      <div
        className="rounded-md border border-dashed bg-surface p-4 text-center text-body text-foreground-tertiary"
        data-testid="dream-operations-empty"
      >
        {t("No per-edge operations were returned for this dream pass.", "此次记忆整理没有返回逐边操作。")}
      </div>
    );
  }

  const counts = sectionCounts(operations);
  const writes = operations.writes ?? [];
  const proposals = operations.proposals ?? [];
  const demotions = operations.demotions ?? [];
  const entityInvalidations = operations.entity_invalidations ?? [];

  return (
    <div
      className="rounded-md border bg-surface p-3"
      data-testid="dream-operations-view"
    >
      <Text variant="eyebrow" as="p" className="mb-2">
        {t("Operations", "操作")}
      </Text>
      <Accordion
        type="multiple"
        defaultValue={["writes", "proposals", "demotions", "entities"]}
      >
        <AccordionItem value="writes">
          <AccordionTrigger>
            <SectionLabel
              icon={<Icon icon={FilePlusIcon} size={14} />}
              label={t("Writes", "写入")}
              count={counts.writes}
            />
          </AccordionTrigger>
          <AccordionContent>
            {writes.length === 0 ? (
              <EmptyRow text={t("No writes recorded.", "没有记录写入。")} />
            ) : (
              <ul className="space-y-1.5">
                {writes.map((w, i) => (
                  <DreamWriteRow
                    key={(w.edge_uuid ?? "w") + i.toString()}
                    item={w}
                  />
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="proposals">
          <AccordionTrigger>
            <SectionLabel
              icon={<Icon icon={BulbIcon} size={14} />}
              label={t("Proposals", "提议")}
              count={counts.proposals}
            />
          </AccordionTrigger>
          <AccordionContent>
            {proposals.length === 0 ? (
              <EmptyRow text={t("No proposals recorded.", "没有记录提议。")} />
            ) : (
              <ul className="space-y-1.5">
                {proposals.map((p, i) => (
                  <DreamWriteRow
                    key={(p.edge_uuid ?? "p") + i.toString()}
                    item={p}
                  />
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="demotions">
          <AccordionTrigger>
            <SectionLabel
              icon={<Icon icon={Delete02Icon} size={14} />}
              label={t("Demotions", "降级")}
              count={counts.demotions}
            />
          </AccordionTrigger>
          <AccordionContent>
            {demotions.length === 0 ? (
              <EmptyRow text={t("No demotions recorded.", "没有记录降级。")} />
            ) : (
              <ul className="space-y-1.5">
                {demotions.map((d) => (
                  <DreamDemotionRow key={d.edge_uuid} item={d} />
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="entities">
          <AccordionTrigger>
            <SectionLabel
              icon={<Icon icon={Alert01Icon} size={14} />}
              label={t("Entity invalidations", "实体失效")}
              count={counts.entities}
            />
          </AccordionTrigger>
          <AccordionContent>
            {entityInvalidations.length === 0 ? (
              <EmptyRow text={t("No entity invalidations recorded.", "没有记录实体失效。")} />
            ) : (
              <ul className="space-y-1.5">
                {entityInvalidations.map((e) => (
                  <DreamEntityInvalidationRow key={e.entity_uuid} item={e} />
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface SectionLabelProps {
  icon: React.ReactNode;
  label: string;
  count: number;
}

function SectionLabel({ icon, label, count }: SectionLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 text-body font-medium text-foreground-emphasis">
      {icon}
      {label}
      <span className="rounded bg-surface-hover px-1.5 py-0.5 text-caption font-normal text-foreground-secondary">
        {count}
      </span>
    </span>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-1 py-2 text-caption text-foreground-tertiary">
      {text}
    </div>
  );
}
