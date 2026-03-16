// /lib/scanStore.ts
import { v4 as uuidv4 } from "uuid";

export type SeverityCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type ScanRun = {
  id: string;
  repoUrl: string;
  buildAfterScan: boolean;
  status: "queued" | "running" | "finished" | "failed";
  step: string;
  progress: number; // 0-100
  counts: SeverityCounts;
  createdAt: string;
  updatedAt: string;
  pipelineUrl?: string;
  logs?: string[];
  buildStatus?: "idle" | "queued" | "running" | "succeeded" | "failed";
};

const store = new Map<string, ScanRun>();

function now() {
  return new Date().toISOString();
}

// create a new scan run and store it
export function createScanRun(params: {
  repoUrl: string;
  buildAfterScan: boolean;
}) {
  const id = uuidv4();
  const run: ScanRun = {
    id,
    repoUrl: params.repoUrl,
    buildAfterScan: params.buildAfterScan,
    status: "queued",
    step: "queued",
    progress: 0,
    counts: { critical: 0, high: 0, medium: 0, low: 0 },
    createdAt: now(),
    updatedAt: now(),
    logs: [],
    buildStatus: "idle",
  };
  store.set(id, run);

  // simulate the run in background (mock)
  simulateScanProgress(id);

  return run;
}

export function getScanRun(id: string) {
  return store.get(id) ?? null;
}

export function updateScanRun(id: string, patch: Partial<ScanRun>) {
  const r = store.get(id);
  if (!r) return null;
  const updated = { ...r, ...patch, updatedAt: now() };
  store.set(id, updated);
  return updated;
}

// Mock: simulate scan steps with setTimeout
function simulateScanProgress(id: string) {
  const steps = [
    { step: "cloning", duration: 800 },
    { step: "gitleaks", duration: 1200 },
    { step: "semgrep", duration: 1200 },
    { step: "trivy", duration: 1000 },
    { step: "finalizing", duration: 600 },
  ];

  let idx = 0;
  updateScanRun(id, { status: "running", step: steps[0].step, progress: 5 });
  const runNext = () => {
    const run = store.get(id);
    if (!run) return;
    // simulate counts accumulating
    const randomCounts = (): Partial<SeverityCounts> => ({
      critical: Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0,
      high: Math.random() < 0.4 ? Math.floor(Math.random() * 4) : 0,
      medium: Math.floor(Math.random() * 6),
      low: Math.floor(Math.random() * 8),
    });

    const step = steps[idx];
    updateScanRun(id, {
      step: step.step,
      progress: Math.min(90, (idx / (steps.length - 1)) * 80 + 5),
      logs: [...(run.logs ?? []), `Step ${step.step} started`],
    });

    setTimeout(() => {
      const runNow = store.get(id);
      if (!runNow) return;
      // merge counts
      const add = randomCounts();
      const newCounts = {
        critical: runNow.counts.critical + (add.critical ?? 0),
        high: runNow.counts.high + (add.high ?? 0),
        medium: runNow.counts.medium + (add.medium ?? 0),
        low: runNow.counts.low + (add.low ?? 0),
      };

      updateScanRun(id, {
        counts: newCounts,
        logs: [...(runNow.logs ?? []), `Step ${step.step} finished`],
        progress: Math.min(95, ((idx + 1) / steps.length) * 95),
      });

      idx++;
      if (idx < steps.length) {
        runNext();
      } else {
        // finished
        updateScanRun(id, {
          status: "finished",
          step: "done",
          progress: 100,
          logs: [...(store.get(id)?.logs ?? []), "Scan finished (mock)"],
          // mock pipeline URL
          pipelineUrl: `https://gitlab.example.com/mock/pipelines/${id}`,
        });
      }
    }, step.duration);
  };

  // start chain
  setTimeout(runNext, 200);
}

// Mock: simulate build when user confirms
export function triggerBuild(id: string) {
  const run = store.get(id);
  if (!run) return null;
  updateScanRun(id, {
    buildStatus: "queued",
    logs: [...(run.logs ?? []), "Build queued"],
  });

  setTimeout(() => {
    const r2 = store.get(id);
    if (!r2) return;
    updateScanRun(id, {
      buildStatus: "running",
      logs: [...(r2.logs ?? []), "Build started"],
    });

    // finish after a while
    setTimeout(() => {
      const r3 = store.get(id);
      if (!r3) return;
      // randomly succeed/fail in mock
      const success = Math.random() > 0.1;
      updateScanRun(id, {
        buildStatus: success ? "succeeded" : "failed",
        logs: [
          ...(r3.logs ?? []),
          success ? "Build succeeded" : "Build failed",
        ],
      });
    }, 2000);
  }, 800);

  return getScanRun(id);
}
