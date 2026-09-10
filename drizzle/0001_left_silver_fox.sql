CREATE TABLE "icps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"industry" text,
	"company_size" text,
	"geography" text,
	"business_model" text,
	"pain_points" text[],
	"goals" text[],
	"buying_signals" text[],
	"disqualifiers" text[],
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "icps_business_model_check" CHECK ("icps"."business_model" IS NULL OR "icps"."business_model" IN ('b2b', 'b2c', 'b2b2c', 'marketplace'))
);
--> statement-breakpoint
ALTER TABLE "icps" ADD CONSTRAINT "icps_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "icps_product_id_idx" ON "icps" USING btree ("product_id");