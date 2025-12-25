-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromptVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "temperature" REAL NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "thinkingType" TEXT NOT NULL,
    "budgetTokens" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptVariant_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "changedBy" TEXT,
    "changeNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ABTest_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "abTestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 0.5,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ABVariant_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "ABTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABVariantConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "abVariantId" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "temperature" REAL NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "thinkingType" TEXT NOT NULL,
    "budgetTokens" INTEGER,
    CONSTRAINT "ABVariantConfig_abVariantId_fkey" FOREIGN KEY ("abVariantId") REFERENCES "ABVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_key_key" ON "Prompt"("key");

-- CreateIndex
CREATE INDEX "Prompt_key_idx" ON "Prompt"("key");

-- CreateIndex
CREATE INDEX "Prompt_isActive_idx" ON "Prompt"("isActive");

-- CreateIndex
CREATE INDEX "PromptVariant_promptId_idx" ON "PromptVariant"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVariant_promptId_variantType_key" ON "PromptVariant"("promptId", "variantType");

-- CreateIndex
CREATE INDEX "PromptVersion_promptId_idx" ON "PromptVersion"("promptId");

-- CreateIndex
CREATE INDEX "PromptVersion_createdAt_idx" ON "PromptVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_promptId_version_key" ON "PromptVersion"("promptId", "version");

-- CreateIndex
CREATE INDEX "ABTest_promptId_idx" ON "ABTest"("promptId");

-- CreateIndex
CREATE INDEX "ABTest_isActive_idx" ON "ABTest"("isActive");

-- CreateIndex
CREATE INDEX "ABVariant_abTestId_idx" ON "ABVariant"("abTestId");

-- CreateIndex
CREATE INDEX "ABVariantConfig_abVariantId_idx" ON "ABVariantConfig"("abVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ABVariantConfig_abVariantId_variantType_key" ON "ABVariantConfig"("abVariantId", "variantType");
