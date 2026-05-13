import { db } from "..";
import { feedFollows, feeds, users } from "../schema";
import { and, eq } from "drizzle-orm";
import { getFeedByUrl } from "./feeds";

export async function createFeedFollow(feedId: string, userId: string) {
    const [newFeedFollow] = await db.insert(feedFollows).values({
        feed_id: feedId,
        user_id: userId
    }).returning();

    const [innerJoin] = await db.select().from(feedFollows).innerJoin(feeds, eq(feedFollows.feed_id, feeds.id)).innerJoin(users, eq(feedFollows.user_id, users.id)).where(eq(feedFollows.id, newFeedFollow?.id));
    return innerJoin;
}

export async function getAllFeedFollows() {
    const result = await db.select().from(feedFollows);
    return result;
}

export async function getFeedFollowsForUser(userId: string) {
    const result = await db.select().from(feedFollows).where(eq(feedFollows.user_id, userId)).innerJoin(feeds, eq(feedFollows.feed_id, feeds.id));
    return result;
}

export async function deleteFeedFollow(userId: string, feedUrl: string) {
    const feed = await getFeedByUrl(feedUrl);
    if (!feed) {
        throw new Error(`Feed ${feedUrl} does not exist`);
    }
    const result = await db.delete(feedFollows).where(and(eq(feedFollows.user_id, userId), eq(feedFollows.feed_id, feed.id)));
    return result;
}

export type FeedFollow = typeof feedFollows.$inferSelect;