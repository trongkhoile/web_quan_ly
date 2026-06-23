-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mt5Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "mt5Login" TEXT NOT NULL,
    "mt5Password" TEXT NOT NULL,
    "mt5Server" TEXT NOT NULL,
    "terminalPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mt5Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Mt5Account" ("createdAt", "id", "isActive", "mt5Login", "mt5Password", "mt5Server", "name", "terminalPath", "updatedAt") SELECT "createdAt", "id", "isActive", "mt5Login", "mt5Password", "mt5Server", "name", "terminalPath", "updatedAt" FROM "Mt5Account";
DROP TABLE "Mt5Account";
ALTER TABLE "new_Mt5Account" RENAME TO "Mt5Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
