import { ImportValidationError } from "./validation";

export const MAX_QWENWORK_DB_BYTES = 64 * 1024 * 1024;
export const SQLITE_HEADER = "SQLite format 3\0";

export function findQwenWorkDatabase(files: File[]) {
  const databases = files.filter(
    (file) =>
      file.name.toLowerCase() === "agents.db" &&
      /^[^/\\]+\/(?:data\/)?agents\.db$/i.test(file.webkitRelativePath),
  );
  if (databases.length !== 1)
    throw new ImportValidationError("qwenwork-folder");
  const [database] = databases;
  if (!database.size) throw new ImportValidationError("qwenwork-database");
  if (database.size > MAX_QWENWORK_DB_BYTES)
    throw new ImportValidationError("qwenwork-db-size");

  const base = database.webkitRelativePath.toLowerCase();
  if (
    files.some(
      (file) =>
        file.size > 0 &&
        [base + "-wal", base + "-journal"].includes(
          file.webkitRelativePath.toLowerCase(),
        ),
    )
  ) {
    throw new ImportValidationError("qwenwork-busy");
  }
  return database;
}

export async function checkQwenWorkAttachmentFiles(files: File[]) {
  for (const file of new Set(files)) {
    const prefix = await file.slice(0, SQLITE_HEADER.length).arrayBuffer();
    if (new TextDecoder().decode(prefix) === SQLITE_HEADER) {
      throw new ImportValidationError("qwenwork-db-attachment");
    }
  }
}
