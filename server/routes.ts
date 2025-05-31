import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});
import { insertUserSchema, insertFileSchema, insertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe subscription endpoint
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const customer = await stripe.customers.create({
        metadata: { userId: userId.toString() }
      });

      const product = await stripe.products.create({
        name: 'CalcPro Pro Subscription',
      });

      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: 1000, // $10.00
        recurring: { interval: 'month' },
        product: product.id
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00
        currency: 'usd',
        customer: customer.id,
        metadata: {
          userId: userId.toString(),
          type: 'pro_subscription'
        },
      });

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByPin(userData.pin);
      
      if (existingUser) {
        return res.status(400).json({ message: "PIN already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      await storage.createSettings({
        userId: user.id,
        theme: "light",
        language: "en",
        isPremium: false,
      });
      
      res.json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:pin", async (req, res) => {
    try {
      const { pin } = req.params;
      const user = await storage.getUserByPin(pin);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/recovery/:securityAnswer", async (req, res) => {
    try {
      const { securityAnswer } = req.params;
      const user = await storage.getUserBySecurityAnswer(securityAnswer);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ pin: user.pin });
    } catch (error: any) {
      console.error("Error in PIN recovery:", error);
      res.status(500).json({ message: "Failed to recover PIN" });
    }
  });

  // File routes
  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error: any) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.get("/api/files/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const files = await storage.getFilesByUserId(userId);
      res.json(files);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:userId/:folder", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { folder } = req.params;
      const files = await storage.getFilesByUserIdAndFolder(userId, folder);
      res.json(files);
    } catch (error: any) {
      console.error("Error fetching folder files:", error);
      res.status(500).json({ message: "Failed to fetch folder files" });
    }
  });

  app.delete("/api/files/:id/:userId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const deleted = await storage.deleteFile(fileId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get("/api/storage/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getStorageStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({ message: "Failed to fetch storage stats" });
    }
  });

  // Settings routes
  app.post("/api/settings", async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.parse(req.body);
      const settings = await storage.createSettings(settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Error creating settings:", error);
      res.status(500).json({ message: "Failed to create settings" });
    }
  });

  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getSettingsByUserId(userId);
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updateData = req.body;
      const settings = await storage.updateSettings(userId, updateData);
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

