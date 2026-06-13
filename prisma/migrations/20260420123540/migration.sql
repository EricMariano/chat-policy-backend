/*
  Warnings:

  - A unique constraint covering the columns `[acronym]` on the table `tb_system` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `acronym` to the `tb_system` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tb_system" ADD COLUMN     "acronym" VARCHAR(5) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tb_system_acronym_key" ON "tb_system"("acronym");
