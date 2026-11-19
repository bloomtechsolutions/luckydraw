-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "onePerDevice" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "deviceId" TEXT;

-- CreateIndex
CREATE INDEX "Registration_matchId_deviceId_idx" ON "Registration"("matchId", "deviceId");

