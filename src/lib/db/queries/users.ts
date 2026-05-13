import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

export async function createUser(name: string) {
    const [result] = await db.insert(users).values({ name: name }).returning();
    return result;
}

export async function getUser(name: string) {
    const [result] = await db.select().from(users).where(eq(users.name, name)).limit(1);
    return result;
}

export async function getUserById(id: string) {
    const [result] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result;
}

export async function resetUsers() {
    await db.delete(users);
}

export async function getUsers() {
    return await db.select().from(users);
}

export type User = typeof users.$inferSelect; 