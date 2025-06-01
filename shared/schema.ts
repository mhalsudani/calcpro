import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  pin: text("pin").notNull(),
  securityQuestion: text("security_question"),
  securityAnswer: text("security_answer"),
  subscriptionType: text("subscription_type").default("free"), // 'free' or 'pro'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // 'active', 'inactive', 'canceled'
  subscriptionEndDate: timestamp("subscription_end_date"),
  usedStorage: decimal("used_storage", { precision: 10, scale: 2 }).default("0"), // in MB
  maxStorage: decimal("max_storage", { precision: 10, scale: 2 }).default("50"), // 50MB for free, unlimited for pro
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image', 'video', 'document'
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // base64 encoded file data
  folder: text("folder").notNull().default("general"), // 'images', 'documents', 'videos'
  isCompressed: boolean("is_compressed").default(false),
  originalSize: integer("original_size"),
  storageType: text("storage_type").notNull().default("local"), // 'local' or 'cloud'
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  theme: text("theme").notNull().default("light"), // 'light' or 'dark'
  language: text("language").notNull().default("en"), // 'en' or 'ar'
  isPremium: boolean("is_premium").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  pin: true,
  securityQuestion: true,
  securityAnswer: true,
  subscriptionType: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionEndDate: true,
  usedStorage: true,
  maxStorage: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  userId: true,
  name: true,
  type: true,
  size: true,
  mimeType: true,
  data: true,
  folder: true,
  isCompressed: true,
  originalSize: true,
  storageType: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  theme: true,
  language: true,
  isPremium: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
