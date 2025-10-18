/*
  Warnings:

  - The `embedding` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "products" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector(768);
