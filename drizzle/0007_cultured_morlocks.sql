CREATE TABLE "positioning" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"positioning_statement" text,
	"target_customer" text,
	"customer_problem" text,
	"unique_value" text,
	"alternatives" text[],
	"proof_points" text[],
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "positioning" ADD CONSTRAINT "positioning_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "positioning_product_id_idx" ON "positioning" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "positioning_one_active_per_product" ON "positioning" USING btree ("product_id") WHERE "positioning"."archived_at" IS NULL;