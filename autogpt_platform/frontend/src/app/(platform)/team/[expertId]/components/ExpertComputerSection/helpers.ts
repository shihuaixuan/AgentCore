import type { ComputerInfo } from "@/app/api/__generated__/models/computerInfo";
import type { SandboxSummary } from "@/app/api/__generated__/models/sandboxSummary";
type Translate = (english: string, chinese: string) => string;
const englishText: Translate = (english) => english;

export function formatSandboxState(
  summary: SandboxSummary | null | undefined,
  t: Translate = englishText,
) {
  if (!summary) return t("Not created yet", "尚未创建");
  if (summary.state === "running") {
    const since = new Date(summary.started_at);
    const time = since.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return t(`Running since ${time}`, `自 ${time} 起运行`);
  }
  return t(
    "Suspended. Resumes in about a second when needed.",
    "已挂起，需要时约 1 秒内恢复。",
  );
}

export function formatResources(summary: SandboxSummary | null | undefined) {
  if (!summary) return null;
  const gib = summary.memory_mb / 1024;
  const memory =
    gib >= 1
      ? `${Number.isInteger(gib) ? gib : gib.toFixed(1)} GiB`
      : `${summary.memory_mb} MiB`;
  return `${summary.cpu_count} vCPU · ${memory}`;
}

export function formatScreen(
  computer: Pick<ComputerInfo, "box" | "screen_on">,
  t: Translate = englishText,
) {
  if (!computer.box) {
    return t(
      "Screen off. It comes on the first time a task needs a browser or GUI app.",
      "屏幕已关闭，任务首次需要浏览器或图形应用时开启。",
    );
  }
  return computer.screen_on
    ? t(
        "Screen on. Open the desktop to watch or take over.",
        "屏幕已开启，打开桌面以查看或接管。",
      )
    : t(
        "Screen off. Turning it on happens inside this same machine.",
        "屏幕已关闭，开启后仍使用同一台计算机。",
      );
}

export function describeMount(
  path: string,
  computer: Pick<ComputerInfo, "workspace_path" | "shared_path" | "owner_kind">,
  t: Translate = englishText,
) {
  if (path === computer.workspace_path) {
    return computer.owner_kind === "expert"
      ? t(
          "Its own home. Tools, notes and configs live here.",
          "专属主目录，存放工具、笔记和配置。",
        )
      : t("Your workspace.", "你的工作区。");
  }
  if (path === computer.shared_path) {
    return t(
      "Your workspace, shared. Deliverables dropped here reach your desktop.",
      "共享的工作区，放在此处的成果会出现在你的桌面上。",
    );
  }
  return t("Mounted volume.", "已挂载的存储卷。");
}

export function desktopActionLabel(
  computer: ComputerInfo | null | undefined,
  t: Translate = englishText,
) {
  if (!computer?.box || !computer.screen_on)
    return t("Turn on screen", "开启屏幕");
  return computer.box.state === "running"
    ? t("Open desktop", "打开桌面")
    : t("Resume desktop", "恢复桌面");
}
