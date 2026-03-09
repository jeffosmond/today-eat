-- CreateTable
CREATE TABLE "Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "duration" INTEGER,
    "type" TEXT NOT NULL,
    "mealTags" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "drinkId" INTEGER,
    "stapleId" INTEGER,
    "dishId" INTEGER,
    "date" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Record_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Dish" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Record_stapleId_fkey" FOREIGN KEY ("stapleId") REFERENCES "Dish" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Record_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Dish_type_idx" ON "Dish"("type");

-- CreateIndex
CREATE INDEX "Dish_enabled_idx" ON "Dish"("enabled");

-- CreateIndex
CREATE INDEX "Record_date_idx" ON "Record"("date");

-- CreateIndex
CREATE INDEX "Record_mealType_idx" ON "Record"("mealType");

-- CreateIndex
CREATE UNIQUE INDEX "Record_date_mealType_key" ON "Record"("date", "mealType");
