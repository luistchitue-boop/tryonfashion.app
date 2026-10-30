export const CREDIT_PACKAGES = [
  { id: "starter", credits: 10, priceCents: 299, name: "Starter", description: "10 virtual try-ons" },
  { id: "creator", credits: 40, priceCents: 999, name: "Creator", description: "40 virtual try-ons", popular: true },
  { id: "studio", credits: 100, priceCents: 1999, name: "Studio", description: "100 virtual try-ons" },
] as const;

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]["id"];

export const CREDIT_COSTS = {
  imageGeneration: 1,
} as const;

export function getCreditPackage(id: string) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === id);
}
