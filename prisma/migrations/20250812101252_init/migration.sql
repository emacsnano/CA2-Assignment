/*
  Warnings:

  - A unique constraint covering the columns `[discount_rule_id,product_id]` on the table `discount_rule_products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "discount_rule_products_discount_rule_id_product_id_key" ON "public"."discount_rule_products"("discount_rule_id", "product_id");

-- AddForeignKey
ALTER TABLE "public"."discount_rule_products" ADD CONSTRAINT "discount_rule_products_discount_rule_id_fkey" FOREIGN KEY ("discount_rule_id") REFERENCES "public"."discount_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_rule_products" ADD CONSTRAINT "discount_rule_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
