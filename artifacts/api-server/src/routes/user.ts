import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db/schema";
import { UpdateUserProfileBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/user/profile", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  let profile = await db.query.userProfilesTable.findFirst({
    where: eq(userProfilesTable.clerkUserId, userId),
  });

  if (!profile) {
    [profile] = await db
      .insert(userProfilesTable)
      .values({ clerkUserId: userId })
      .onConflictDoNothing()
      .returning();

    if (!profile) {
      profile = await db.query.userProfilesTable.findFirst({
        where: eq(userProfilesTable.clerkUserId, userId),
      });
    }
  }

  res.json({
    clerkUserId: profile!.clerkUserId,
    displayName: profile!.displayName,
    createdAt: profile!.createdAt,
  });
});

router.put("/user/profile", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateUserProfileBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const [profile] = await db
    .insert(userProfilesTable)
    .values({ clerkUserId: userId, displayName: parsed.data.displayName })
    .onConflictDoUpdate({
      target: userProfilesTable.clerkUserId,
      set: { displayName: parsed.data.displayName },
    })
    .returning();

  res.json({
    clerkUserId: profile.clerkUserId,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
  });
});

export default router;
