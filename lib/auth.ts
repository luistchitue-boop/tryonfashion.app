import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: { email, name, image: clerkUser.imageUrl },
    });
  }

  const userWithSameEmail = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (userWithSameEmail) {
    return prisma.user.update({
      where: { id: userWithSameEmail.id },
      data: { clerkId: userId, name, image: clerkUser.imageUrl },
    });
  }

  return prisma.user.create({
    data: { clerkId: userId, email, name, image: clerkUser.imageUrl },
  });
}