-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'IN_PROGRESS');

-- CreateTable
CREATE TABLE "InstallerUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "installerId" TEXT NOT NULL,
    "productSN" TEXT NOT NULL,
    "clietnName" TEXT NOT NULL,
    "installDate" TIMESTAMP(3) NOT NULL,
    "status" "WarrantyStatus" NOT NULL,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallerRegistrationKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "installerId" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallerRegistrationKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstallerUser_email_key" ON "InstallerUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InstallerRegistrationKey_key_key" ON "InstallerRegistrationKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InstallerRegistrationKey_installerId_key" ON "InstallerRegistrationKey"("installerId");

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallerRegistrationKey" ADD CONSTRAINT "InstallerRegistrationKey_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallerRegistrationKey" ADD CONSTRAINT "InstallerRegistrationKey_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
