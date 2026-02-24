import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, varchar, json, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
      credits: integer("credits").default(0),
  role: text("role", { enum: ['admin', 'creator', 'analyst'] }).default("creator").notNull(),

 // role: text("role").default("creator"),
  // toolname:text("tname").default("no")
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
export const captions = pgTable("captions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userInput: varchar(),
  content: json(),
  plateform: varchar(),
  tone: varchar(),
  userEmail: varchar(), // REMOVED: .references(() => users.email)
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

  createdOn: varchar(),
});
export const titles = pgTable("titles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userInput: varchar(),
  content: json(),
  contentType: varchar(),
  tone: varchar(),
  userEmail: varchar(),
    userId: text('userId'),

  createdOn: varchar(),
});
export const videoScripts = pgTable("videoScripts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userInput: varchar(),
  content: json(),
  videoType: varchar(),
  tone: varchar(),
  duration: integer(),
  userEmail: varchar(),
      userId: text('userId'),

  createdOn: varchar(),
});
export const thumbnailsTable = pgTable('thumbnails', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userInput: text('userInput'),
  thumbnailURL: text('thumbnailURL').notNull(),
  refImage: text('refImage'),
  includeImage: text('includeImage'),
  userEmail: text('userEmail').notNull(),
  userId: text('userId'),
  createdOn: text('createdOn').notNull(),
});
// db/schema.ts (add this new table)

export const socialPostsTable = pgTable('social_posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userInput: text('userInput').notNull(),
  postUrl: text('postUrl').notNull(),
  includeImage: text('includeImage'),
  platform: text('platform').notNull(), // 'instagram' or 'facebook'
  aspectRatio: text('aspectRatio').notNull(), // '1:1', '4:5', '16:9', etc.
  userEmail: text('userEmail').notNull(),
  userId: text('userId'),
  createdOn: text('createdOn').notNull(),
});

// You can also add an enum for better type safety
export const platformEnum = ['instagram', 'facebook'] as const;
export const aspectRatios = {
  instagram: ['1:1', '4:5', '16:9', '9:16'],
  facebook: ['1:1', '16:9', '9:16', '4:5']
} as const;
// db/schema.ts (add this new table)

// db/schema.ts - Update enhancedPostsTable
export const enhancedPostsTable = pgTable('enhanced_posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  originalImageUrl: text('originalImageUrl').notNull(),
  enhancedImageUrl: text('enhancedImageUrl').notNull(),
  platform: text('platform').notNull(),
  enhancementType: text('enhancementType').notNull(),
  enhancementSettings: jsonb('enhancementSettings'),
  userInput: text('userInput'),
  userEmail: text('userEmail').notNull(),
  userId: text('userId'),
  createdOn: text('createdOn').notNull(),
});

// Enhancement types enum
export const enhancementTypes = [
  'basic',           // Basic adjustments (brightness, contrast, saturation)
  'crop',            // Crop and resize
  'rotate',          // Rotate and flip
  'filters',         // Instagram-like filters
  'overlay',         // Text and stickers overlay
  'borders',         // Borders and frames
  'optimize'         // Auto optimize for social platforms
] as const;

export const platformPresets = {
  instagram: {
    name: 'Instagram',
    size: { width: 1080, height: 1080 },
    aspectRatios: ['1:1', '4:5', '16:9', '9:16']
  },
  facebook: {
    name: 'Facebook',
    size: { width: 1200, height: 630 },
    aspectRatios: ['1.91:1', '1:1', '4:5', '16:9']
  },
  twitter: {
    name: 'Twitter',
    size: { width: 1024, height: 512 },
    aspectRatios: ['2:1', '1:1', '16:9']
  }
} as const;
export const creditsTransactionsTable = pgTable("credits_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  amount: integer().notNull(),
  type: varchar({ length: 20 }).notNull(), // 'purchase', 'tool_usage', 'refund', 'bonus'
  description: text(),
  toolUsed: varchar({ length: 50 }),
  remainingCredits: integer().notNull(),
  createdAt: timestamp().defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("credit_userId_idx").on(table.userId)]);

// Tool pricing table
export const toolPricingTable = pgTable("tool_pricing", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tool_name: varchar({ length: 50 }).notNull().unique(),
  credits_required: integer().notNull(),
});