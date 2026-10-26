import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return syncClerkUser({
    clerkId: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
    image: clerkUser.imageUrl,
  });
}

export async function syncClerkUser(profile: {
  clerkId: string;
  email: string | null;
  name: string | null;
  image: string | null;
}) {
  const db = getDb();
  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, profile.clerkId)).limit(1);

  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({ email: profile.email, name: profile.name, image: profile.image, updatedAt: new Date() })
      .where(eq(users.id, existingUser.id))
      .returning();
    return updatedUser;
  }

  const [userWithSameEmail] = profile.email
    ? await db.select().from(users).where(eq(users.email, profile.email)).limit(1)
    : [];
  if (userWithSameEmail) {
    const [updatedUser] = await db
      .update(users)
      .set({ clerkId: profile.clerkId, name: profile.name, image: profile.image, updatedAt: new Date() })
      .where(eq(users.id, userWithSameEmail.id))
      .returning();
    return updatedUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), ...profile })
    .returning();
  return createdUser;
}