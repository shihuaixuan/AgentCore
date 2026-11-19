export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof document === "undefined") return false;

  try {
    const clipboard = navigator.clipboard;
    if (clipboard?.writeText) {
      await clipboard.writeText(text);
      return true;
    }
  } catch {
    // Some browsers expose the API but deny the write.
  }

  // The Clipboard API is unavailable on plain HTTP. Try the browser's copy
  // command while handling the user's click.
  return copyViaHiddenTextarea(text);
}

function copyViaHiddenTextarea(text: string): boolean {
  if (typeof document.execCommand !== "function") return false;

  const previousFocus = document.activeElement;
  const container =
    previousFocus?.closest('dialog, [role="dialog"], [role="alertdialog"]') ??
    document.body;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.tabIndex = -1;
  textarea.className = "pointer-events-none fixed left-0 top-0 opacity-0";

  try {
    container.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    if (document.activeElement !== textarea) return false;
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
  }
}
