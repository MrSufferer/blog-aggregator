import { scrapeFeeds } from "./lib/db/queries/feeds";
import { getDaemonState, writeDaemonStateFile, writeDaemonLog, processPid } from "./daemon";

const MAX_RESTARTS = 5;
const MAX_BACKOFF_MS = 60000;

export async function runDaemonLoop(intervalMs: number) {
    const state = getDaemonState();
    const restartCount = state?.restartCount ?? 0;

    writeDaemonLog(`Daemon loop started, interval=${intervalMs}ms, restartCount=${restartCount}`);

    let consecutiveErrors = 0;

    process.on("SIGTERM", () => {
        writeDaemonLog("SIGTERM received, shutting down gracefully");
        writeDaemonStateFile(null);
        process.exit(0);
    });

    while (true) {
        try {
            writeDaemonLog("Fetching feeds...");
            await scrapeFeeds();
            consecutiveErrors = 0;
        } catch (error) {
            consecutiveErrors++;
            const errMsg = error instanceof Error ? error.message : String(error);
            writeDaemonLog(`Feed fetch error: ${errMsg} (consecutive=${consecutiveErrors})`);

            if (consecutiveErrors >= MAX_RESTARTS) {
                writeDaemonLog(`Max errors reached (${MAX_RESTARTS}), exiting`);
                const currentState = getDaemonState();
                if (currentState) {
                    writeDaemonStateFile({ ...currentState, status: "crashed" });
                }
                process.exit(1);
            }

            const backoffMs = Math.min(intervalMs * consecutiveErrors * 2, MAX_BACKOFF_MS);
            writeDaemonLog(`Backing off for ${backoffMs}ms`);
            await sleep(backoffMs);
            continue;
        }

        await sleep(intervalMs);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const intervalArg = parseInt(process.argv[process.argv.length - 1]);
if (isNaN(intervalArg)) {
    console.error("Missing interval argument");
    process.exit(1);
}

runDaemonLoop(intervalArg).catch(err => {
    console.error("Daemon loop error:", err);
    process.exit(1);
});