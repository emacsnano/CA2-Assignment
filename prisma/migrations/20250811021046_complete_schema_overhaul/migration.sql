/*
  Warnings:

  - A unique constraint covering the columns `[cart_id,product_id]` on the table `cart_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_product_id_key" ON "public"."cart_item"("cart_id", "product_id");

-- AddForeignKey
ALTER TABLE "public"."cart" ADD CONSTRAINT "cart_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_item" ADD CONSTRAINT "cart_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
