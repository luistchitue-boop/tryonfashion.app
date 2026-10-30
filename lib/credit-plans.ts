export const CREDIT_PACKAGES = [
  { id: "starter", credits: 100, priceCents: 499, name: "Starter", description: "A little room to explore" },
  { id: "creator", credits: 500, priceCents: 1999, name: "Creator", description: "For regular styling sessions", popular: true },
  { id: "studio", credits: 1200, priceCents: 3999, name: "Studio", description: "Best for making more looks" },
] as const;

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]["id"];

export const CREDIT_COSTS = {
  imageGeneration: 1,
  videoGeneration: 5,
  galleryUpload: 1,
} as const;

export function getCreditPackage(id: string) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === id);
}
