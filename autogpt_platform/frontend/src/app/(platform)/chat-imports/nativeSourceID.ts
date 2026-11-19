import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const namespaces = {
  workbuddy: "workbuddy-jsonl-v1",
  qwenwork: "qwenwork-db-v1",
} as const;

export function nativeSourceID(source: keyof typeof namespaces, id: string) {
  const data = new TextEncoder().encode(`${namespaces[source]}\0${id}`);
  return bytesToHex(sha256(data));
}
