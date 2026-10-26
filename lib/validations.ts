import { z } from "zod";

export const savedItemSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required."),
  brand: z.string().trim().max(200).optional().or(z.literal("")),
  productUrl: z
    .string()
    .trim()
    .min(1, "Product URL is required.")
    .url("Please enter a valid URL."),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "Image URL must be a valid http(s) URL.",
    ),
  price: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Price must be a valid number."),
  currency: z.string().trim().max(10).optional().or(z.literal("")),
  source: z.string().trim().min(1, "Source is required."),
});

export const extractedItemSchema = savedItemSchema.extend({
  id: z.string().optional(),
});
