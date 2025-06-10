import { users, files, settings, type User, type InsertUser, type File, type InsertFile, type Settings, type InsertSettings } from "@shared/schema";
import { db } from "./db";
import { eq, and, sum } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  getUserBySecurityAnswer(securityAnswer: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripe(userId: number, stripeData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionType?: string;
    subscriptionStatus?: string;
    maxStorage?: string;
    subscriptionEndDate?: Date;
  }): Promise<User | undefined>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getFilesByUserIdAndFolder(userId: number, folder: string): Promise<File[]>;
  deleteFile(id: number, userId: number): Promise<boolean>;
  getStorageStats(userId: number): Promise<{ used: number; total: number; isUnlimited: boolean }>;
  
  // Settings operations
  createSettings(settings: InsertSettings): Promise<Settings>;
  getSettingsByUserId(userId: number): Promise<Settings | undefined>;
  updateSettings(userId: number, settings: Partial<InsertSettings>): Promise<Settings | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const userId = id > 2147483647 ? Math.abs(id) % 2147483647 : id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user || undefined;
  }

  async getUserBySecurityAnswer(securityAnswer: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.securityAnswer, securityAnswer));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.userId, userId));
  }

  async getFilesByUserIdAndFolder(userId: number, folder: string): Promise<File[]> {
    return await db.select().from(files).where(
      and(eq(files.userId, userId), eq(files.folder, folder))
    );
  }

  async deleteFile(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getStorageStats(userId: number): Promise<{ used: number; total: number; isUnlimited: boolean }> {
    const user = await this.getUser(userId);
    if (!user) return { used: 0, total: 50, isUnlimited: false };

    async getStorageStats(userId: number): Promise<{ used: number; total: number; isUnlimited: boolean }> {
  const user = await this.getUser(userId);
  if (!user) return { used: 0, total: 0, isUnlimited: true };

  const userFiles = await this.getFilesByUserId(userId);
  const used = userFiles.reduce((total, file) => total + file.size, 0) / (1024 * 1024); // Convert to MB

  return { used: Math.round(used * 100) / 100, total: 0, isUnlimited: true };
}

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [settings] = await db
      .insert(settings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async getSettingsByUserId(userId: number): Promise<Settings | undefined> {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    return userSettings || undefined;
  }

  async updateSettings(userId: number, updateData: Partial<InsertSettings>): Promise<Settings | undefined> {
    const [updated] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || undefined;
  }

  async updateUserStripe(userId: number, stripeData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionType?: string;
    subscriptionStatus?: string;
    maxStorage?: string;
    subscriptionEndDate?: Date;
  }): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(stripeData)
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
