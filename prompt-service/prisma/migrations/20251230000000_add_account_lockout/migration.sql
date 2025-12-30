-- AlterTable: Add account lockout fields to User
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockoutUntil" DATETIME;
ALTER TABLE "User" ADD COLUMN "lastFailedLoginAt" DATETIME;

-- CreateIndex
CREATE INDEX "User_lockoutUntil_idx" ON "User"("lockoutUntil");
