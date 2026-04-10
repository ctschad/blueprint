import { existsSync } from "fs";
import os from "os";
import path from "path";

type BiomarkersRuntimeConfig = {
  backend: "cpu" | "gpu";
  modelPath: string;
  projectRoot: string;
  pythonPath: string;
  workerScriptPath: string;
};

let cachedConfig: BiomarkersRuntimeConfig | null = null;

function resolveProjectRoot() {
  return process.cwd();
}

function resolveModelPath() {
  return (
    process.env.BIOMARKERS_MODEL_PATH ||
    path.join(os.homedir(), "Downloads", "gemma-4-E2B-it.litertlm")
  );
}

function resolvePythonPath(projectRoot: string) {
  return (
    process.env.BIOMARKERS_PYTHON_PATH ||
    path.join(projectRoot, ".venv-litertlm", "bin", "python")
  );
}

function resolveWorkerBackend() {
  return process.env.BIOMARKERS_WORKER_BACKEND === "gpu" ? "gpu" : "cpu";
}

function resolveWorkerScriptPath(projectRoot: string) {
  return path.join(projectRoot, "scripts", "biomarkers_llm_worker.py");
}

export function getBiomarkersRuntimeConfig(): BiomarkersRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const projectRoot = resolveProjectRoot();
  const config: BiomarkersRuntimeConfig = {
    backend: resolveWorkerBackend(),
    modelPath: resolveModelPath(),
    projectRoot,
    pythonPath: resolvePythonPath(projectRoot),
    workerScriptPath: resolveWorkerScriptPath(projectRoot)
  };

  cachedConfig = config;
  return config;
}

export function getBiomarkersRuntimeAvailability() {
  const config = getBiomarkersRuntimeConfig();

  return {
    ...config,
    hasModel: existsSync(config.modelPath),
    hasPython: existsSync(config.pythonPath),
    hasWorkerScript: existsSync(config.workerScriptPath)
  };
}
