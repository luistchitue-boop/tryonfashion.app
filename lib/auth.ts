import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const db = getDb();
  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);

  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({ email, name, image: clerkUser.imageUrl, updatedAt: new Date() })
      .where(eq(users.id, existingUser.id))
      .returning();
    return updatedUser;
  }

  const [userWithSameEmail] = email
    ? await db.select().from(users).where(eq(users.email, email)).limit(1)
    : [];
  if (userWithSameEmail) {
    const [updatedUser] = await db
      .update(users)
      .set({ clerkId: userId, name, image: clerkUser.imageUrl, updatedAt: new Date() })
      .where(eq(users.id, userWithSameEmail.id))
      .returning();
    return updatedUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), clerkId: userId, email, name, image: clerkUser.imageUrl })
    .returning();
  return createdUser;
}