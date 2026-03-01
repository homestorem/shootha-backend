import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "shootha_secret_2026";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    (req as any).userId = payload.userId;
    (req as any).userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: "الجلسة منتهية، يرجى تسجيل الدخول مجدداً" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body as { phone: string };
      if (!phone || phone.length < 10) {
        return res.status(400).json({ message: "رقم الهاتف غير صحيح" });
      }
      const otp = generateOtp();
      await storage.storeOtp(phone, otp);
      console.log(`[OTP] ${phone} → ${otp}`);
      return res.json({ message: "تم إرسال رمز التحقق", devOtp: otp });
    } catch (e) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, name, role, otp, deviceId } = req.body as {
        phone: string;
        name: string;
        role: string;
        otp: string;
        deviceId?: string;
      };

      if (!phone || !name || !role || !otp) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      const existing = await storage.getAuthUserByPhone(phone);
      if (existing) {
        return res.status(409).json({ message: "هذا الرقم مسجل مسبقاً" });
      }

      const validOtp = await storage.verifyOtp(phone, otp);
      if (!validOtp) {
        return res.status(400).json({ message: "رمز التحقق غير صحيح أو منتهي" });
      }

      const user = await storage.createAuthUser({ phone, name, role, deviceId });
      const token = signToken(user.id, user.role);

      return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    } catch (e) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, otp } = req.body as { phone: string; otp: string };
      if (!phone || !otp) {
        return res.status(400).json({ message: "رقم الهاتف والرمز مطلوبان" });
      }

      const user = await storage.getAuthUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "الحساب غير موجود، يرجى التسجيل أولاً" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "تم حظر هذا الحساب" });
      }

      const validOtp = await storage.verifyOtp(phone, otp);
      if (!validOtp) {
        return res.status(400).json({ message: "رمز التحقق غير صحيح أو منتهي" });
      }

      const token = signToken(user.id, user.role);
      return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    } catch (e) {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getAuthUserById(userId);
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
      return res.json({ id: user.id, name: user.name, phone: user.phone, role: user.role });
    } catch {
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
