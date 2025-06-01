import { storage } from '../server/storage.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { pin } = req.body;
      const user = await storage.getUserByPin(pin);
      
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
