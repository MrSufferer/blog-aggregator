import { CommandHandler } from "./commands";
import { readConfig } from "./config";
import { getUser, User } from "./lib/db/queries/users";

type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
    return async (cmdName: string, ...args: string[]) => {
        const userName = readConfig().currentUserName || "";
        const user = await getUser(userName);
        if (!user) {
            throw new Error(`User ${userName} not logged in`);
        }
        await handler(cmdName, user, ...args);
    }
}