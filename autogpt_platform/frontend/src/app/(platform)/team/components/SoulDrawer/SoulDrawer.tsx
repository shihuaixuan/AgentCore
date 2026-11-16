"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertSoulUpdate } from "@/app/api/__generated__/models/expertSoulUpdate";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { LockIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { environment } from "@/services/environment";
import { cn } from "@/lib/utils";
import { ExpertSidePanel } from "../ExpertSidePanel/ExpertSidePanel";
import { LearnedNotes } from "./components/LearnedNotes/LearnedNotes";
import { SoulSectionTitle } from "./SoulSectionTitle";
import { useBottomScrollShadow } from "./useBottomScrollShadow";
import { useSoulDrawer } from "./useSoulDrawer";

interface Props {
  expert: Expert | null;
  onClose: () => void;
}

export function SoulDrawer({ expert, onClose }: Props) {
  return (
    <ExpertSidePanel
      identity={
        expert
          ? {
              name: expert.name,
              avatarUrl: expert.avatar_url,
              color: expert.color,
            }
          : null
      }
      title={expert ? `${expert.name}'s Soul` : ""}
      panelId="soul"
      closeLabel="Close Soul panel"
      onClose={onClose}
    >
      {expert ? <SoulPanelBody expert={expert} onClose={onClose} /> : null}
    </ExpertSidePanel>
  );
}

interface BodyProps {
  expert: Expert;
  onClose: () => void;
}

function SoulPanelBody({ expert, onClose }: BodyProps) {
  const { t } = useTranslation();
  const { soul, updateField, save, isPending, canSave } = useSoulDrawer({
    expert,
    onClose,
  });
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );
  const hasMoreBelow = useBottomScrollShadow(scrollElement);

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={setScrollElement}
          className="h-full overflow-y-auto px-5 py-5"
        >
          <Text variant="small" tone="muted" className="mb-5">
            {t(
              "A living document that shapes every reply.",
              "持续更新的文档，影响每一次回复。",
            )}
          </Text>
          <SoulFields soul={soul} updateField={updateField} />
          {environment.isGraphMemoryAvailable() ? (
            <LearnedNotes expertId={expert.id} />
          ) : null}
          <ProtectedRules rules={expert.protected_soul_rules} />
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface-muted to-transparent transition-opacity duration-200",
            hasMoreBelow ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-t-border-base px-5 py-3">
        <Button type="button" variant="ghost" size="small" onClick={onClose}>
          {t("Cancel", "取消")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="small"
          loading={isPending}
          disabled={!canSave}
        >
          {t("Save Soul", "保存设定")}
        </Button>
      </div>
    </form>
  );
}

interface SoulFieldsProps {
  soul: ExpertSoulUpdate;
  updateField: (field: keyof ExpertSoulUpdate, value: string) => void;
}

function SoulFields({ soul, updateField }: SoulFieldsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Input
        id="soul-name"
        label={t("Name", "名称")}
        labelVariant="small-medium"
        // oxlint-disable-next-line design-system/no-restyle -- Input has no label tone prop (src/components is P9's)
        labelClassName="!text-foreground-body"
        value={soul.name}
        maxLength={100}
        required
        onChange={(event) => updateField("name", event.target.value)}
      />
      <Input
        id="soul-identity"
        label={t("Identity and personality", "身份与个性")}
        labelVariant="small-medium"
        // oxlint-disable-next-line design-system/no-restyle -- Input has no label tone prop (src/components is P9's)
        labelClassName="!text-foreground-body"
        type="textarea"
        rows={6}
        value={soul.identity}
        maxLength={10000}
        required
        onChange={(event) => updateField("identity", event.target.value)}
      />
      <Input
        id="soul-voice"
        label={t("Voice", "语气")}
        labelVariant="small-medium"
        // oxlint-disable-next-line design-system/no-restyle -- Input has no label tone prop (src/components is P9's)
        labelClassName="!text-foreground-body"
        type="textarea"
        rows={3}
        value={soul.voice_preferences}
        maxLength={4000}
        placeholder={t(
          "How should this expert sound?",
          "这位专家应使用怎样的表达风格？",
        )}
        onChange={(event) =>
          updateField("voice_preferences", event.target.value)
        }
      />
      <Input
        id="soul-boundaries"
        label={t("Boundaries", "边界")}
        labelVariant="small-medium"
        // oxlint-disable-next-line design-system/no-restyle -- Input has no label tone prop (src/components is P9's)
        labelClassName="!text-foreground-body"
        type="textarea"
        rows={4}
        value={soul.boundaries}
        maxLength={4000}
        placeholder={t(
          "What should this expert avoid or ask about first?",
          "这位专家应避免什么，或先征求哪些事项的同意？",
        )}
        onChange={(event) => updateField("boundaries", event.target.value)}
      />
    </div>
  );
}

function ProtectedRules({ rules }: { rules: string[] }) {
  const { t } = useTranslation();
  return (
    <section className="border-t border-border-base pt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex text-foreground-tertiary">
          <Icon icon={LockIcon} size={16} />
        </span>
        <SoulSectionTitle>
          {t("Protected rules", "受保护规则")}
        </SoulSectionTitle>
      </div>
      <div className="space-y-2 rounded-xl bg-surface-muted p-4">
        {rules.map((rule) => (
          <div key={rule} className="flex gap-2 text-foreground-secondary">
            <Icon icon={LockIcon} size={14} className="mt-0.5 shrink-0" />
            <Text variant="body-tight" as="span" tone="secondary">
              {rule}
            </Text>
          </div>
        ))}
      </div>
      <Text variant="small" tone="muted" className="mt-3">
        {t(
          "These rules are part of every expert's soul and cannot be edited.",
          "这些规则属于每位专家的核心设定，无法编辑。",
        )}
      </Text>
    </section>
  );
}
