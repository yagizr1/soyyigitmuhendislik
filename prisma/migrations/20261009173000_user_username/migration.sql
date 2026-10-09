ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = lower(split_part("email", '@', 1))
WHERE "username" IS NULL;

UPDATE "User" AS target
SET "username" = target."username" || '-' || left(target."id", 6)
WHERE target."id" IN (
  SELECT "id"
  FROM (
    SELECT "id", row_number() OVER (PARTITION BY "username" ORDER BY "createdAt") AS rn
    FROM "User"
  ) ranked
  WHERE rn > 1
);

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
