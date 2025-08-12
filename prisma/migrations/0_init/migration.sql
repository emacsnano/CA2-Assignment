-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."member" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "dob" DATE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" INTEGER NOT NULL,
    "gender" CHAR(1) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(25),

    CONSTRAINT "member_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "unit_price" DECIMAL NOT NULL,
    "stock_quantity" DECIMAL NOT NULL DEFAULT 0,
    "country" VARCHAR(100),
    "product_type" VARCHAR(50),
    "image_url" VARCHAR(255) DEFAULT '/images/product.png',
    "manufactured_on" TIMESTAMP(6),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale_order" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER,
    "order_datetime" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(10),

    CONSTRAINT "sale_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale_order_item" (
    "id" SERIAL NOT NULL,
    "sale_order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL,

    CONSTRAINT "sale_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comment" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "review_text" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_username_key" ON "public"."member"("username");

-- CreateIndex
CREATE UNIQUE INDEX "member_email_key" ON "public"."member"("email");

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "fk_member_role_id" FOREIGN KEY ("role") REFERENCES "public"."member_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sale_order" ADD CONSTRAINT "fk_sale_order_member" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sale_order_item" ADD CONSTRAINT "fk_sale_order_item_product" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sale_order_item" ADD CONSTRAINT "fk_sale_order_item_sale_order" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."review"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."review" ADD CONSTRAINT "review_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."review" ADD CONSTRAINT "review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

