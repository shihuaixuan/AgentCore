import { z } from "zod";

const fileBlock = z.object({
  type: z.string(),
  path: z.string().optional(),
  text: z.string().optional(),
});
const fileKinds = new Set(["file", "input_file", "output_file", "attachment"]);
const fileExtension = /\.[\p{L}\p{N}][\p{L}\p{N}_-]{0,15}$/u;
const drive = /^[a-z]:\//i;
const maxReferences = 100;

export function extractAttachmentPaths(content: unknown[]) {
  const paths = new Set<string>();
  for (const block of content) {
    const parsed = fileBlock.safeParse(block);
    if (!parsed.success) continue;
    const { type, path, text } = parsed.data;
    if (fileKinds.has(type) && path) addPath(paths, path);
    if (text && ["input_text", "output_text", "text"].includes(type)) {
      for (const match of text.matchAll(
        /\]\(\s*(?:<([^<>\r\n]+)>|([^\s()]+))\s*\)|`([^`\r\n]+)`/g,
      )) {
        let candidate = match[1] ?? match[2] ?? match[3];
        if (match[2] && !candidate.startsWith("file:")) {
          try {
            candidate = decodeURIComponent(candidate);
          } catch {
            continue;
          }
        }
        addPath(paths, candidate);
      }
      for (const line of text.split("\n")) {
        const candidate = line.trim();
        if (/^(?:[a-z]:[\\/]|file:\/\/\/)/i.test(candidate))
          addPath(paths, candidate);
      }
    }
  }
  return [...paths];
}

function addPath(paths: Set<string>, candidate: string) {
  if (paths.size >= maxReferences) return;
  const path = normalizeLocalPath(candidate);
  if (path && fileExtension.test(path)) paths.add(path);
}

export function normalizeLocalPath(input: string): string | undefined {
  if (input.length > 1024 || /[\u0000-\u001f\u007f<>|?*"#]/u.test(input))
    return;
  let path = input.trim().replaceAll("\\", "/");
  if (/^file:\/\/\//i.test(path)) {
    try {
      path = decodeURIComponent(path.slice(7));
    } catch {
      return;
    }
    if (/^\/[a-z]:\//i.test(path)) path = path.slice(1);
    if (/[\u0000-\u001f\u007f<>|?*"#]/u.test(path) || path.includes("\\"))
      return;
  }
  if (
    path.startsWith("//") ||
    (path.includes(":") && (!drive.test(path) || path.slice(2).includes(":")))
  )
    return;
  if (path.startsWith("./")) path = path.slice(2);
  if (path.split("/").includes("..") || path.split("/").includes(".")) return;
  return path.replace(/\/+$/, "") || undefined;
}

type DirectoryIndex = {
  folder: string;
  exact: Map<string, File | null>;
  folded: Map<string, File | null>;
};

export function indexAttachmentDirectory(files: File[]): DirectoryIndex {
  const folder = files[0]?.webkitRelativePath.split("/")[0] ?? "";
  const exact = new Map<string, File | null>();
  const folded = new Map<string, File | null>();
  for (const file of files) {
    const [root, ...parts] = file.webkitRelativePath.split("/");
    if (
      !folder ||
      root !== folder ||
      parts.at(-1) !== file.name ||
      parts.some(
        (part) => !part || part === "." || part === ".." || part.includes("\\"),
      )
    )
      continue;
    const path = parts.join("/");
    exact.set(path, exact.has(path) ? null : file);
    const key = path.toLowerCase();
    folded.set(key, folded.has(key) ? null : file);
  }
  return { folder, exact, folded };
}

export function resolveAttachment(
  reference: string,
  sourceRoot: string,
  index: DirectoryIndex,
  workingDirectory?: string,
) {
  const root = normalizeLocalPath(sourceRoot);
  let target = normalizeLocalPath(reference);
  if (!root || !target || (!drive.test(`${root}/`) && !root.startsWith("/")))
    return;
  const windows = drive.test(`${root}/`);
  function compare(value: string) {
    return windows ? value.toLowerCase() : value;
  }
  if (compare(root.split("/").at(-1) ?? "") !== compare(index.folder)) return;

  if (!drive.test(target) && !target.startsWith("/")) {
    const base =
      workingDirectory === undefined
        ? root
        : normalizeLocalPath(workingDirectory);
    if (!base || (!drive.test(`${base}/`) && !base.startsWith("/"))) return;
    target = `${base}/${target}`;
  }
  const rootParts = root.split("/");
  const targetParts = target.split("/");
  if (
    !rootParts.every(
      (part, index) => compare(part) === compare(targetParts[index] ?? ""),
    )
  )
    return;
  const relative = targetParts.slice(rootParts.length).join("/");
  return (
    (windows
      ? index.folded.get(compare(relative))
      : index.exact.get(relative)) ?? undefined
  );
}
