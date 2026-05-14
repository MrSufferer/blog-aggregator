import { startDaemon, stopDaemon, restartDaemon, getDaemonStatus } from "./daemon";
import { parseDuration } from "./rss";

export async function handlerService(cmdName: string, ...args: string[]) {
    const sub = args[0];
    const subArgs = args.slice(1);
    switch (sub) {
        case "start": return handlerServiceStart(cmdName, ...subArgs);
        case "stop": return handlerServiceStop(cmdName, ...subArgs);
        case "restart": return handlerServiceRestart(cmdName, ...subArgs);
        case "status": return handlerServiceStatus(cmdName, ...subArgs);
        default: throw new Error(`Unknown service subcommand: ${sub}. Use: start, stop, restart, status`);
    }
}

export async function handlerServiceStart(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        throw new Error("service start requires an interval (e.g., 30s, 5m, 1h)");
    }
    const intervalMs = parseDuration(args[0]);
    startDaemon(intervalMs);
    console.log(`Daemon started with interval ${args[0]}`);
}

export async function handlerServiceStop(cmdName: string, ...args: string[]) {
    stopDaemon();
    console.log("Daemon stopped");
}

export async function handlerServiceRestart(cmdName: string, ...args: string[]) {
    restartDaemon();
    console.log("Daemon restarted");
}

export async function handlerServiceStatus(cmdName: string, ...args: string[]) {
    const status = getDaemonStatus();
    if (!status.running && !status.pid) {
        console.log("Daemon not running");
        return;
    }
    console.log(`Status: ${status.status}`);
    console.log(`PID: ${status.pid}`);
    console.log(`Uptime: ${status.uptime}`);
    console.log(`Interval: ${status.interval}ms`);
    console.log(`Restarts: ${status.restartCount}`);
}