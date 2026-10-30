import {
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerkId"),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { precision: 3, mode: "date" }),
    image: text("image"),
    creditBalance: integer("creditBalance").notNull().default(2),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("User_clerkId_key").on(table.clerkId), uniqueIndex("User_email_key").on(table.email)],
);

export const accounts = pgTable(
  "Account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("Account_provider_providerAccountId_key").on(table.provider, table.providerAccountId),
    index("Account_userId_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "Session",
  {
    id: text("id").primaryKey(),
    sessionToken: text("sessionToken").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: timestamp("expires", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("Session_sessionToken_key").on(table.sessionToken), index("Session_userId_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token], name: "VerificationToken_identifier_token_key" })],
);

export const savedItems = pgTable(
  "SavedItem",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    productName: text("productName").notNull(),
    brand: text("brand"),
    productUrl: text("productUrl").notNull(),
    imageUrl: text("imageUrl"),
    price: numeric("price", { precision: 65, scale: 30, mode: "number" }),
    currency: text("currency"),
    source: text("source").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("SavedItem_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("SavedItem_userId_productName_idx").on(table.userId, table.productName),
  ],
);

export const creditTransactions = pgTable(
  "CreditTransaction",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type").notNull(),
    reference: text("reference").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("CreditTransaction_reference_key").on(table.reference),
    index("CreditTransaction_userId_createdAt_idx").on(table.userId, table.createdAt),
  ],
);
