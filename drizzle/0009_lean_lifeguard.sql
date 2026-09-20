CREATE TABLE "research_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"competitor_id" uuid,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"source_name" text,
	"source_url" text,
	"content" text,
	"date_researched" date,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_product_id_idx" ON "research_items" USING btree ("product_id");