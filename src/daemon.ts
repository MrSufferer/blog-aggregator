import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";
import * as fsSync from "fs";

type DaemonState = {
    pid: number;
    startedAt: string;
    interval: number;
    restartCount: number;
    status: "running" | "stopped" | "crashed";
};

const GATOR_DIR = path.resolve(os.homedir(), ".gator");
const DAEMON_FILE = path.resolve(GATOR_DIR, "daemon.json");
const LOG_DIR = path.resolve(GATOR_DIR, "logs");

export function ensureDirectories() {
    if (!fs.existsSync(GATOR_DIR)) {
        fs.mkdirSync(GATOR_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

export function getDaemonState(): DaemonState | null {
    if (!fs.existsSync(DAEMON_FILE)) {
        return null;
    }
    const raw = fs.readFileSync(DAEMON_FILE, "utf-8");
    return JSON.parse(raw) as DaemonState;
}

export function writeDaemonStateFile(state: DaemonState | null) {
    ensureDirectories();
    if (state === null) {
        if (fs.existsSync(DAEMON_FILE)) {
            fs.unlinkSync(DAEMON_FILE);
        }
        return;
    }
    fs.writeFileSync(DAEMON_FILE, JSON.stringify(state, null, 2));
}

export function writeDaemonLog(message: string) {
    ensureDirectories();
    const date = new Date().toISOString().split("T")[0];
    const logFile = path.resolve(LOG_DIR, `daemon-${date}.log`);
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

export function startDaemon(intervalMs: number): void {
    const existing = getDaemonState();
    if (existing && existing.status === "running" && processPid(existing.pid)) {
        throw new Error(`Daemon already running with PID ${existing.pid}`);
    }

    ensureDirectories();
    const tsxPath = path.resolve(__dirname, "..", "node_modules", ".bin", "tsx");
    const srcPath = path.resolve(__dirname, "daemon-run.ts");

    const child = spawn(process.execPath, [tsxPath, srcPath, String(intervalMs)], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"],
    });

    child.unref();

    const state: DaemonState = {
        pid: child.pid,
        startedAt: new Date().toISOString(),
        interval: intervalMs,
        restartCount: 0,
        status: "running",
    };
    writeDaemonStateFile(state);
    writeDaemonLog(`Daemon started with PID ${child.pid}, interval ${intervalMs}ms`);
}

export function stopDaemon(): void {
    const state = getDaemonState();
    if (!state) {
        throw new Error("No daemon running");
    }
    if (processPid(state.pid)) {
        try {
            process.kill(state.pid, "SIGTERM");
            writeDaemonLog(`Daemon PID ${state.pid} killed`);
        } catch {
            writeDaemonLog(`Failed to kill PID ${state.pid}`);
        }
    }
    writeDaemonStateFile(null);
}

export function getDaemonStatus(): { running: boolean; pid?: number; uptime?: string; interval?: number; restartCount?: number; status?: string } {
    const state = getDaemonState();
    if (!state) {
        return { running: false };
    }
    const isRunning = processPid(state.pid);
    const uptime = isRunning
        ? msToHuman(Date.now() - new Date(state.startedAt).getTime())
        : "stopped";
    return {
        running: isRunning,
        pid: state.pid,
        uptime,
        interval: state.interval,
        restartCount: state.restartCount,
        status: isRunning ? "running" : state.status,
    };
}

export function restartDaemon(): void {
    const state = getDaemonState();
    if (!state) {
        throw new Error("No daemon running");
    }
    if (processPid(state.pid)) {
        try {
            process.kill(state.pid, "SIGTERM");
        } catch { }
    }
    writeDaemonStateFile({ ...state, status: "stopped", pid: 0 });
    startDaemon(state.interval);
}

export function processPid(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function msToHuman(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}