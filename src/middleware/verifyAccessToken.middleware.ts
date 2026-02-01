import { Request, Response, NextFunction } from "express";
import { TokenUtil } from "../utils/token.util";
import { AUTH_ERRORS } from "../constants/auth-error.constant";

export function verifyAccessToken(req: Request, res: Response, next: NextFunction,) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw AUTH_ERRORS.UNAUTHORIZED;
    }

    const token = authHeader.split(" ")[1];
    const payload = TokenUtil.verifyAccessToken(token);

    // gắn payload cho controller dùng
    (req as any).auth = {
      account_id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      code: "AUTH_401",
      message: "Unauthorized",
    });
  }
}
