/*
  Warnings:

  - You are about to drop the column `clietnName` on the `Warranty` table. All the data in the column will be lost.
  - Added the required column `clientName` to the `Warranty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Warranty" DROP COLUMN "clietnName",
ADD COLUMN     "clientName" TEXT NOT NULL;
