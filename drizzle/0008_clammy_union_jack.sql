CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"website" text,
	"category" text,
	"description" text,
	"strengths" text[],
	"weaknesses" text[],
	"differentiators" text[],
	"pricing_notes" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitors_product_id_idx" ON "competitors" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competitors_one_active_per_product_name" ON "competitors" USING btree ("product_id","name_normalized") WHERE "competitors"."archived_at" IS NULL;