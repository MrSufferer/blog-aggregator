import { db } from "..";
import { posts } from "../schema";
import { desc, inArray } from "drizzle-orm";

export async function createPost(title: string, url: string, description: string, publishedAt: Date, feedId: string) {
    const [newPost] = await db.insert(posts).values({
        title,
        url,
        description,
        publishedAt,
        feed_id: feedId
    }).returning();
    return newPost;
}

export async function getPostsForUser(userId: string, limit: number = 10) {
    const result = await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(limit);
    return result;
}

export type Post = typeof posts.$inferSelect;