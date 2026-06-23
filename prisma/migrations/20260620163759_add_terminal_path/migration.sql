/*
  Warnings:

  - You are about to drop the column `metaApiId` on the `Mt5Account` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mt5Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mt5Login" TEXT NOT NULL,
    "mt5Password" TEXT NOT NULL,
    "mt5Server" TEXT NOT NULL,
    "terminalPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Mt5Account" ("createdAt", "id", "isActive", "mt5Login", "mt5Password", "mt5Server", "name", "updatedAt") SELECT "createdAt", "id", "isActive", "mt5Login", "mt5Password", "mt5Server", "name", "updatedAt" FROM "Mt5Account";
DROP TABLE "Mt5Account";
ALTER TABLE "new_Mt5Account" RENAME TO "Mt5Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
