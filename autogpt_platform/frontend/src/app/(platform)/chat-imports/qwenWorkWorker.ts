import { readQwenWorkDatabase } from "./qwenWorkDatabase";
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

scope.onmessage = async function readDirectoryDatabase({
  data: { raw, page },
}) {
  try {
    const result = await readQwenWorkDatabase(raw, page, {
      locateFile: () => new URL(wasm.href, self.location.origin).href,
    });
    scope.postMessage({ result });
  } catch (error) {
    scope.postMessage({
      error:
        error instanceof ImportValidationError ? error.code : "qwenwork-reader",
    });
  }
};
