import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user?.clerkId) return NextResponse.json({ error: "Sign in to update your account." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("name" in body) || typeof body.name !== "string") {
    return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
  }

  const name = body.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Display name must be between 1 and 80 characters." }, { status: 400 });
  }

  const [firstName, ...lastNameParts] = name.split(" ");
  const lastName = lastNameParts.join(" ");
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.updateUser(user.clerkId, { firstName, lastName });
    const updatedName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
    await getDb().update(users).set({ name: updatedName, updatedAt: new Date() }).where(eq(users.id, user.id));
    return NextResponse.json({ name: updatedName ?? name });
  } catch (error) {
    console.error("Clerk account profile update failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not update your account. Please try again." }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user?.clerkId) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Confirm account deletion to continue." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("confirmation" in body) || body.confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(user.clerkId);
  } catch (error) {
    console.error("Clerk account deletion failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not delete your sign-in account. Your data has not been removed." }, { status: 502 });
  }

  try {
    await getDb().delete(users).where(eq(users.id, user.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Local account data cleanup failed after Clerk deletion", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Your sign-in account was deleted, but app data cleanup needs support. Please contact support." }, { status: 500 });
  }
}
