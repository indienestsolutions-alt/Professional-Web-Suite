import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import type { AuthUser } from "@workspace/api-zod";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Lazy upsert: ensure a user row exists for FK relationships.
  // Profile info (name, email, avatar) is fetched client-side from Clerk.
  await db
    .insert(usersTable)
    .values({ id: userId })
    .onConflictDoNothing();

  req.user = {
    id: userId,
    email: null,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
  };

  next();
}
