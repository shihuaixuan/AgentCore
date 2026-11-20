import {
  openQwenWorkDatabase,
  type QwenWorkDatabaseReader,
} from "./qwenWorkDatabase";
import type {
  QwenWorkWorkerRequest,
  QwenWorkWorkerResponse,
} from "./readQwenWorkInWorker";
import { ImportValidationError } from "./validation";

const wasm = new URL("sql.js/dist/sql-wasm-browser.wasm", import.meta.url);
const scope = self as unknown as {
  onmessage: (event: MessageEvent<QwenWorkWorkerRequest>) => Promise<void>;
  postMessage: (response: QwenWorkWorkerResponse) => void;
};

let reader: QwenWorkDatabaseReader | undefined;
let opened = false;

scope.onmessage = async function readDirectoryDatabase({ data }) {
  try {
    if (data.type === "open" && !opened) {
      opened = true;
      reader = await openQwenWorkDatabase(data.raw, {
        locateFile: () => new URL(wasm.href, self.location.origin).href,
      });
      scope.postMessage({ type: "opened", total: reader.total });
    } else if (data.type === "read-page" && reader) {
      scope.postMessage({ type: "page", result: reader.readPage(data.page) });
    } else {
      throw new ImportValidationError("qwenwork-reader");
    }
  } catch (error) {
    reader?.close();
    reader = undefined;
    scope.postMessage({
      type: "error",
      code:
        error instanceof ImportValidationError ? error.code : "qwenwork-reader",
    });
  }
};
