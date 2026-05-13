import { readConfig, setUser } from "./config";
import { createFeedFollow, deleteFeedFollow, FeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feedFollows";
import { createFeed, Feed, getAllFeeds, getFeedByUrl, scrapeFeeds } from "./lib/db/queries/feeds";
import { getPostsForUser } from "./lib/db/queries/posts";
import { createUser, getUser, getUserById, getUsers, resetUsers, User } from "./lib/db/queries/users";
import { fetchFeed, parseDuration } from "./rss";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length == 0)
        throw new Error("Login command requires a username");

    const userName = args[0];

    const user = await getUser(userName);

    if (!user) {
        throw new Error(`User ${userName} does not exist.`)
    }

    setUser(userName);
    console.log(`User ${userName} has been set`);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
    if (args.length == 0)
        throw new Error("Register command requires a username");

    const userName = args[0];

    const user = await getUser(userName);

    if (user) {
        throw new Error(`User ${userName} already exists`);
    }

    const newUser = await createUser(userName);

    setUser(userName);
    console.log(`User ${userName} has been created with data: ${JSON.stringify(newUser)}`);
}

export async function handlerReset(cmdName: string, ...args: string[]) {
    await resetUsers();

    setUser("");
    console.log("Users have been reset");
}

export async function handlerListUsers(cmdName: string, ...args: string[]) {
    const users = await getUsers();
    users.forEach(user => {
        if (user.name == readConfig().currentUserName) {
            console.log(`* ${user.name} (current)`);
        } else {
            console.log(`* ${user.name}`);
        }
    })
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
    if (args.length < 1)
        throw new Error("Agg command requires a time between requests");


    const timeBetweenRequests = parseDuration(args[0]);

    console.log(`Collecting feeds every ${timeBetweenRequests}`);

    const handleError = (error: Error) => {
        console.error(error);
    }

    scrapeFeeds().catch(handleError);

    const interval = setInterval(() => scrapeFeeds().catch(handleError), timeBetweenRequests);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
    if (args.length < 2)
        throw new Error("Add feed command requires a feed name and a feed URL");

    const feedName = args[0];
    const feedUrl = args[1];

    const newFeed = await createFeed(feedName, feedUrl, user.id);
    const newFeedFollow = await createFeedFollow(newFeed.id, user.id);

    printFeed(newFeed, user);
}

export async function handlerGetFeeds(cmdName: string, ...args: string[]) {
    const feeds = await getAllFeeds();

    for (const feed of feeds) {
        console.log(`* ${feed.name}`);
        console.log(`* ${feed.url}`);

        const user = await getUserById(feed.user_id);
        console.log(`* ${user?.name}`);
    }
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
    if (args.length < 1)
        throw new Error("Follow command requires a feed URL");

    const url = args[0];
    const feed = await getFeedByUrl(url);
    
    if (!feed) {
        throw new Error(`Feed ${url} does not exist`);
    }

    const newFeedFollow = await createFeedFollow(feed.id, user.id);

    console.log(`Feed ${feed.name} followed by User ${user.name} which has the data: ${JSON.stringify(user)}`);
}

export async function handlerGetFollowing(cmdName: string, user: User, ...args: string[]) {
    const followings = await getFeedFollowsForUser(user.id);
    for (const follow of followings) {
        console.log(`* ${follow.feeds.name}`);
    }
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]) {
    if (args.length < 1)
        throw new Error("Unfollow command requires a feed URL");

    const url = args[0];
    const feed = await getFeedByUrl(url);

    if (!feed) {
        throw new Error(`Feed ${url} does not exist`);
    }

    await deleteFeedFollow(user.id, feed.url);
    console.log(`Feed ${feed.name} unfollowed by User ${user.name}`);
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
    const limit = args.length > 0 ? parseInt(args[0]) : 2;
    const posts = await getPostsForUser(user.id, limit);
    for (const post of posts) {
        console.log(`* ${post.title}`);
    }
}

export async function printFeed(feed: Feed, user: User) {
    console.log(`Feed ${feed.name} has been added with data: ${feed}`);
    console.log(`User ${user.name} created the feed has the data: ${user}`);
}

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const handler = registry[cmdName];

    if (!handler) {
        throw new Error(`Command ${cmdName} not found`);
    }

    await handler(cmdName, ...args);
}
