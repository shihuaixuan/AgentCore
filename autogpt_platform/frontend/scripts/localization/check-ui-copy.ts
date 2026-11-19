import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDirectory } from "./audit-ui-copy.ts";

const frontendRoot = fileURLToPath(new URL("../..", import.meta.url));
const sourceRoot = path.join(frontendRoot, "src");
const technicalCopy: Record<string, string[]> = JSON.parse(
  fs.readFileSync(new URL("./technical-copy.json", import.meta.url), "utf8"),
);
const findings = auditDirectory(sourceRoot).filter((finding) => {
  const relativePath = path
    .relative(sourceRoot, finding.file)
    .replaceAll("\\", "/");
  return !technicalCopy[relativePath]?.includes(finding.text);
});

for (const finding of findings) {
  console.error(
    `${path.relative(frontendRoot, finding.file)}:${finding.line} ${finding.kind}: ${finding.text}`,
  );
}
console.log(
  `界面文案扫描：${findings.length} 条待处理。技术字段豁免见 scripts/localization/technical-copy.json。`,
);
process.exitCode = findings.length > 0 ? 1 : 0;
