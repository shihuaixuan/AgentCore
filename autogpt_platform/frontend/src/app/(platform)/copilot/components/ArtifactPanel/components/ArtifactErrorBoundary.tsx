"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  children: ReactNode;
  artifactID: string;
  artifactTitle: string;
  artifactType: string;
  /** The text being rendered. New text gets a fresh try, even under the same
   *  id, title and type. */
  content?: string | null;
}

interface State {
  error: Error | null;
}

export class ArtifactErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
      tags: { errorBoundary: "true", context: "copilot-artifact" },
      extra: {
        artifactID: this.props.artifactID,
        artifactTitle: this.props.artifactTitle,
        artifactType: this.props.artifactType,
      },
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // An error caught in this very commit belongs to these props: clearing it
    // would only crash and report the same render again.
    if (
      this.state.error &&
      prevState.error === this.state.error &&
      (prevProps.artifactID !== this.props.artifactID ||
        prevProps.artifactTitle !== this.props.artifactTitle ||
        prevProps.artifactType !== this.props.artifactType ||
        prevProps.content !== this.props.content)
    ) {
      this.setState({ error: null });
    }
  }

  handleCopy = () => {
    const { error } = this.state;
    if (!error) return;
    const details = [
      `Artifact: ${this.props.artifactTitle}`,
      `ID: ${this.props.artifactID}`,
      `Type: ${this.props.artifactType}`,
      `Error: ${error.message}`,
      error.stack ? `Stack:\n${error.stack}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard?.writeText(details).catch(() => {});
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <ArtifactRenderError
        error={error}
        title={this.props.artifactTitle}
        onCopy={this.handleCopy}
      />
    );
  }
}

function ArtifactRenderError({
  error,
  title,
  onCopy,
}: {
  error: Error;
  title: string;
  onCopy: () => void;
}) {
  const { t } = useTranslation();
  const message = error.message || t("Unknown rendering error", "未知渲染错误");
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <Text variant="body-medium-tight" tone="body">
        {t("This artifact couldn't be rendered", "无法渲染此产物")}
      </Text>
      <Text variant="small-tight" tone="muted" className="max-w-md break-words">
        {t("Something in ", "产物 ")}
        <span className="font-mono">{title}</span>
        {t(
          " threw an error while rendering. The chat and sidebar are still working.",
          " 渲染时出错。对话和侧栏仍可正常使用。",
        )}
      </Text>
      <pre className="max-h-32 max-w-md overflow-auto rounded-md bg-surface-hover px-3 py-2 text-left text-caption break-words whitespace-pre-wrap text-foreground-body">
        {message}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-md border border-border-base bg-surface px-3 py-1.5 text-caption font-medium text-foreground-body shadow-sm transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
      >
        {t("Copy error details", "复制错误详情")}
      </button>
      <Text variant="small-tight" tone="subtle" className="max-w-md">
        {t(
          "Paste this into the chat so a working version can be regenerated.",
          "将错误详情粘贴到对话中，以便重新生成可用版本。",
        )}
      </Text>
    </div>
  );
}
