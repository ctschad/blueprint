import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { existsSync } from "fs";
import path from "path";

type WorkerPending = {
  reject: (error: Error) => void;
  resolve: (text: string) => void;
  timeout: NodeJS.Timeout;
};

type WorkerMessage =
  | { type: "ready" }
  | { type: "fatal"; error?: string }
  | { type: "response"; id?: string; ok?: boolean; text?: string; error?: string };

type WorkerState = {
  buffer: string;
  nextId: number;
  pending: Map<string, WorkerPending>;
  process: ChildProcessWithoutNullStreams | null;
  startPromise: Promise<void> | null;
  started: boolean;
};

const PROJECT_ROOT = process.cwd();
const MODEL_PATH = "/Users/charlesschad/Downloads/gemma-4-E2B-it.litertlm";
const PYTHON_PATH = path.join(PROJECT_ROOT, ".venv-litertlm", "bin", "python");
const WORKER_SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts", "biomarkers_llm_worker.py");
const REQUEST_TIMEOUT_MS = 60_000;

const globalForBiomarkers = globalThis as typeof globalThis & {
  __blueprintBiomarkersWorker?: WorkerState;
};

const workerState =
  globalForBiomarkers.__blueprintBiomarkersWorker ??
  (globalForBiomarkers.__blueprintBiomarkersWorker = {
    buffer: "",
    nextId: 0,
    pending: new Map(),
    process: null,
    startPromise: null,
    started: false
  });

function isWorkerMessage(value: unknown): value is WorkerMessage {
  return typeof value === "object" && value !== null && "type" in value;
}

function cleanupWorker(reason: Error) {
  if (workerState.process) {
    workerState.process.removeAllListeners();
    workerState.process.kill();
  }

  workerState.process = null;
  workerState.buffer = "";
  workerState.startPromise = null;
  workerState.started = false;

  for (const [id, pending] of workerState.pending) {
    clearTimeout(pending.timeout);
    pending.reject(new Error(`${reason.message} (${id})`));
  }
  workerState.pending.clear();
}

function handleWorkerMessage(message: WorkerMessage, startResolve: () => void, startReject: (error: Error) => void) {
  if (message.type === "ready") {
    workerState.started = true;
    startResolve();
    return;
  }

  if (message.type === "fatal") {
    const error = new Error(message.error || "The Biomarkers worker failed to initialize.");
    cleanupWorker(error);
    startReject(error);
    return;
  }

  if (message.type === "response" && message.id) {
    const pending = workerState.pending.get(message.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    workerState.pending.delete(message.id);

    if (message.ok && typeof message.text === "string") {
      pending.resolve(message.text);
    } else {
      pending.reject(new Error(message.error || "The Biomarkers worker returned an invalid response."));
    }
  }
}

export async function ensureBiomarkersWorker() {
  if (workerState.process && workerState.started) {
    return;
  }

  if (workerState.startPromise) {
    return workerState.startPromise;
  }

  if (!existsSync(PYTHON_PATH)) {
    throw new Error("LiteRT-LM Python runtime is not installed locally.");
  }

  if (!existsSync(WORKER_SCRIPT_PATH)) {
    throw new Error("Biomarkers worker script is missing.");
  }

  if (!existsSync(MODEL_PATH)) {
    throw new Error("The local Gemma model file was not found.");
  }

  workerState.startPromise = new Promise<void>((resolve, reject) => {
    const child = spawn(PYTHON_PATH, [WORKER_SCRIPT_PATH, "--model", MODEL_PATH, "--backend", "cpu"], {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"]
    });

    workerState.process = child;
    workerState.buffer = "";
    workerState.started = false;

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      workerState.buffer += chunk;

      let newlineIndex = workerState.buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = workerState.buffer.slice(0, newlineIndex).trim();
        workerState.buffer = workerState.buffer.slice(newlineIndex + 1);

        if (line) {
          try {
            const parsed = JSON.parse(line) as unknown;
            if (isWorkerMessage(parsed)) {
              handleWorkerMessage(parsed, resolve, reject);
            }
          } catch {
            // Ignore any non-JSON noise from the runtime.
          }
        }

        newlineIndex = workerState.buffer.indexOf("\n");
      }
    });

    child.stderr.setEncoding("utf8");

    child.on("error", (error) => {
      cleanupWorker(error);
      reject(error);
    });

    child.on("exit", (code, signal) => {
      const error = new Error(
        workerState.started
          ? `The Biomarkers worker stopped unexpectedly (${signal || code || "unknown"}).`
          : `The Biomarkers worker failed to start (${signal || code || "unknown"}).`
      );
      cleanupWorker(error);
      if (!workerState.started) {
        reject(error);
      }
    });
  }).finally(() => {
    if (!workerState.started) {
      workerState.startPromise = null;
    }
  });

  return workerState.startPromise;
}

export async function askBiomarkersWorker(prompt: string) {
  await ensureBiomarkersWorker();

  if (!workerState.process || !workerState.process.stdin.writable) {
    throw new Error("The Biomarkers worker is unavailable.");
  }

  const id = `req-${++workerState.nextId}`;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      workerState.pending.delete(id);
      reject(new Error("The Biomarkers worker timed out."));
      cleanupWorker(new Error("The Biomarkers worker timed out."));
    }, REQUEST_TIMEOUT_MS);

    workerState.pending.set(id, { reject, resolve, timeout });

    try {
      workerState.process?.stdin.write(`${JSON.stringify({ id, prompt })}\n`);
    } catch (error) {
      clearTimeout(timeout);
      workerState.pending.delete(id);
      reject(error instanceof Error ? error : new Error("Failed to contact the Biomarkers worker."));
    }
  });
}
