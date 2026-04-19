import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserDoc } from "./models/User.js";

export type AuthedRequest = Request & { userId?: string };

export function signToken(userId: string, secret: string) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: "30d" });
}

export function authMiddleware(secret: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
      res.status(401).json({ error: "未登录" });
      return;
    }
    try {
      const payload = jwt.verify(token, secret) as { sub: string };
      req.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ error: "登录已过期" });
    }
  };
}

export function userPublic(u: UserDoc) {
  return { id: String(u._id), email: u.email, displayName: u.displayName };
}
