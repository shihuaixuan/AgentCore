"use client";

import { useEffect, useState } from "react";
import { ArtifactSkeleton } from "./ArtifactSkeleton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  buildReactArtifactSrcDoc,
  collectPreviewStyles,
  transpileReactArtifactSource,
} from "./reactArtifactPreview";

interface Props {
  source: string;
  title: string;
}

export function ArtifactReactPreview({ source, title }: Props) {
  const { t } = useTranslation();
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setSrcDoc(null);
    setError(null);

    transpileReactArtifactSource(source, title)
      .then((compiledCode) => {
        if (cancelled) return;
        setSrcDoc(
          buildReactArtifactSrcDoc(compiledCode, title, collectPreviewStyles()),
        );
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : t("Failed to build artifact preview", "构建产物预览失败"),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [source, title, t]);

  if (error) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <p className="text-body font-medium text-error-foreground">
          {t("Failed to render React preview", "无法渲染 React 预览")}
        </p>
        <pre className="rounded-md bg-error-surface p-3 font-mono text-caption break-words whitespace-pre-wrap text-error-foreground">
          {error}
        </pre>
      </div>
    );
  }

  if (!srcDoc) {
    return <ArtifactSkeleton />;
  }

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="h-full w-full border-0"
      title={t(`${title} preview`, `${title} 预览`)}
    />
  );
}
