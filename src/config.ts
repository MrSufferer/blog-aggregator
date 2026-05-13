import * as fs from "fs"
import * as path from "path"
import * as os from "os"

type Config = {
    dbUrl: string,
    currentUserName: string | undefined
}

export const setUser = (userName: string) => {
    const config = readConfig();
    config.currentUserName = userName;
    writeConfig(config);
}

export const readConfig = () => {
    const fullPath = getConfigFilePath();
    const rawData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const config: Config = rawData;
    return config;
}

function getConfigFilePath(): string {
    return path.resolve(os.homedir() + "/.gatorconfig.json");
}
function writeConfig(cfg: Config): void {
    const fullPath = getConfigFilePath();
    fs.writeFileSync(fullPath, JSON.stringify(cfg, null, 2))
}

function validateConfig(rawConfig: any): Config {
    const dbUrl = rawConfig.dbUrl;
    const currentUserName = rawConfig.currentUserName;
    return { dbUrl, currentUserName };
}
