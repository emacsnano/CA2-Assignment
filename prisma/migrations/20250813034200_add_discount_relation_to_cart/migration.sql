-- AlterTable
ALTER TABLE "public"."cart" ADD COLUMN     "discount_rule_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."cart" ADD CONSTRAINT "cart_discount_rule_id_fkey" FOREIGN KEY ("discount_rule_id") REFERENCES "public"."discount_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
