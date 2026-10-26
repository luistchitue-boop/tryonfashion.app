import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ClosetClient } from "@/components/closet-client";
import { prisma } from "@/lib/prisma";

export default async function ClosetPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in?callbackUrl=/closet");
  }

  const savedItems = await prisma.savedItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ClosetClient
      initialItems={savedItems.map((item) => ({
        id: item.id,
        productName: item.productName,
        brand: item.brand,
        productUrl: item.productUrl,
        imageUrl: item.imageUrl,
        price: item.price ? Number(item.price) : null,
        currency: item.currency,
        source: item.source,
        createdAt: item.createdAt.toISOString(),
      }))}
      userName={user.name ?? "Fashion lover"}
      userImage={user.image ?? null}
    />
  );
}
