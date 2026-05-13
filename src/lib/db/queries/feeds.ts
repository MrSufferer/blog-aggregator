import { fetchFeed } from "src/rss";
import { db } from ".."
import { feeds } from "../schema";
import { eq, isNull, asc, sql } from "drizzle-orm";
import { createPost } from "./posts";

export async function createFeed(name: string, url: string, userId: string) {
    const [result] = await db.insert(feeds).values({
        name,
        url,
        user_id: userId
    }).returning();
    return result;
}

export async function getAllFeeds() {
    const result = await db.select().from(feeds);
    return result;
}

export async function getFeedByUrl(url: string) {
    const [result] = await db.select().from(feeds).where(eq(feeds.url, url)).limit(1);
    return result;
}

export async function markFeedFetched(feedId: string) {
    const [result] = await db.update(feeds).set({ lastFetchedAt: new Date(), updatedAt: new Date() }).where(eq(feeds.id, feedId)).returning();
    return result;
}

export async function getNextFeedToFetch() {
    const [result] = await db
        .select()
        .from(feeds)
        .orderBy(sql`last_fetched_at ASC NULLS FIRST`)
    return result;
}

export async function scrapeFeeds() {
    const nextFeed = await getNextFeedToFetch();
    if (!nextFeed) {
        throw new Error("No feeds to fetch");
    }

    await markFeedFetched(nextFeed.id);

    const feed = await fetchFeed(nextFeed.url);

    const items = feed.items;
    for (const item of items) {
        console.log(`Creating post ${item.title} for feed ${nextFeed.name}`);
        await createPost(item.title, item.link, item.description, new Date(item.pubDate), nextFeed.id);
    }
}

export type Feed = typeof feeds.$inferSelect; 