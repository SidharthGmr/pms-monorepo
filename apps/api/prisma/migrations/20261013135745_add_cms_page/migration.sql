-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('Draft', 'Published', 'Unpublished', 'Archived');

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "urlOption" TEXT NOT NULL DEFAULT 'default',
    "status" "PageStatus" NOT NULL DEFAULT 'Draft',
    "includeHeader" BOOLEAN NOT NULL DEFAULT true,
    "includeFooter" BOOLEAN NOT NULL DEFAULT true,
    "thumbnailUrl" TEXT,
    "passwordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "conditionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "conditionForm" TEXT,
    "htmlContent" TEXT NOT NULL DEFAULT '',
    "cssContent" TEXT,
    "jsContent" TEXT,
    "metaTitle" VARCHAR(255),
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "canonicalUrl" TEXT,
    "robots" TEXT,
    "ogTitle" VARCHAR(255),
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "schemaMarkup" JSONB,
    "headerScript" TEXT,
    "afterBodyScript" TEXT,
    "footerScript" TEXT,
    "preloadScript" TEXT,
    "hideFromSearch" BOOLEAN NOT NULL DEFAULT false,
    "disableRecaptcha" BOOLEAN NOT NULL DEFAULT false,
    "excludeFromSitemap" BOOLEAN NOT NULL DEFAULT false,
    "sitemapPriority" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPage_storeCode_status_idx" ON "CmsPage"("storeCode", "status");

-- CreateIndex
CREATE INDEX "CmsPage_status_hideFromSearch_excludeFromSitemap_idx" ON "CmsPage"("status", "hideFromSearch", "excludeFromSitemap");

-- AddForeignKey
ALTER TABLE "CmsPage" ADD CONSTRAINT "CmsPage_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
