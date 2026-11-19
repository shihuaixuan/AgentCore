import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId, useRef, useState } from "react";
import { useSaveImport } from "../useImportDraft";
import {
  makeQianwenConversation,
  MAX_QIANWEN_PAIRS,
  type QianwenPair,
} from "../validation";
import { ImportNotice } from "./ImportNotice";
import type { ImportSourceProps } from "./ImportPanel";

type DraftPair = QianwenPair & { id: number };
const EMPTY_PAIR = { id: 0, question: "", answer: "" };

function PairFields({
  pair,
  number,
  disabled,
  onChange,
  onRemove,
}: {
  pair: DraftPair;
  number: number;
  disabled: boolean;
  onChange: (field: keyof QianwenPair, value: string) => void;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <fieldset className="min-w-0 space-y-2 border-t border-border-base pt-2">
      <legend>
        <Text as="span" variant="small-medium" tone="secondary">
          {t(`Pair ${number}`, `问答 ${number}`)}
        </Text>
      </legend>
      <div className="space-y-1">
        <Text as="label" variant="body-medium" htmlFor={`${id}-question`}>
          {t("Question", "问题")}
        </Text>
        <Textarea
          id={`${id}-question`}
          spellCheck={false}
          rows={3}
          value={pair.question}
          disabled={disabled}
          onChange={(event) => onChange("question", event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Text as="label" variant="body-medium" htmlFor={`${id}-answer`}>
          {t("Answer", "回答")}
        </Text>
        <Textarea
          id={`${id}-answer`}
          spellCheck={false}
          rows={5}
          value={pair.answer}
          disabled={disabled}
          onChange={(event) => onChange("answer", event.target.value)}
        />
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="small"
          onClick={onRemove}
          disabled={disabled}
        >
          {t(`Remove pair ${number}`, `移除问答 ${number}`)}
        </Button>
      )}
    </fieldset>
  );
}

export function QianwenImport({ ownerID, onSaved }: ImportSourceProps) {
  const { t } = useTranslation();
  const id = useId();
  const [title, setTitle] = useState("");
  const [pairs, setPairs] = useState([EMPTY_PAIR]);
  const nextID = useRef(1);
  const save = useSaveImport(ownerID, onSaved);
  const complete =
    title.trim() &&
    pairs.every(({ question, answer }) => question.trim() && answer.trim());

  function addPair() {
    const pair = { ...EMPTY_PAIR, id: nextID.current++ };
    setPairs((previous) =>
      previous.length < MAX_QIANWEN_PAIRS ? [...previous, pair] : previous,
    );
  }

  function editPair(id: number, field: keyof QianwenPair, value: string) {
    setPairs((previous) =>
      previous.map((pair) =>
        pair.id === id ? { ...pair, [field]: value } : pair,
      ),
    );
  }

  function removePair(id: number) {
    setPairs((previous) =>
      previous.length > 1
        ? previous.filter((pair) => pair.id !== id)
        : previous,
    );
  }

  async function handleSave() {
    if (await save.save(() => [makeQianwenConversation(title, pairs)])) {
      setTitle("");
      setPairs([EMPTY_PAIR]);
    }
  }

  return (
    <div className="space-y-3">
      <Text variant="body" tone="secondary">
        {t(
          "Paste the question and answer into separate fields.",
          "请分别粘贴问题和回答。",
        )}
      </Text>
      <Input
        id={`${id}-title`}
        label={t("Title", "标题")}
        spellCheck={false}
        size="small"
        value={title}
        disabled={save.pending}
        onChange={(event) => setTitle(event.target.value)}
        autoComplete="off"
      />
      {pairs.map((pair, index) => (
        <PairFields
          key={pair.id}
          pair={pair}
          number={index + 1}
          disabled={save.pending}
          onChange={(field, value) => editPair(pair.id, field, value)}
          onRemove={pairs.length > 1 ? () => removePair(pair.id) : undefined}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={addPair}
          disabled={save.pending || pairs.length >= MAX_QIANWEN_PAIRS}
        >
          {t("Add pair", "添加问答")}
        </Button>
        <Button
          type="button"
          size="small"
          onClick={handleSave}
          loading={save.pending}
          disabled={save.pending || !complete}
        >
          {t("Save to archive", "保存到归档")}
        </Button>
      </div>
      <ImportNotice error={save.error} result={save.result} />
    </div>
  );
}
