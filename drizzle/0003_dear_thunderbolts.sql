CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icp_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"goals" text[],
	"pain_points" text[],
	"motivations" text[],
	"objections" text[],
	"decision_criteria" text[],
	"preferred_channels" text[],
	"messaging_angles" text[],
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_icp_id_icps_id_fk" FOREIGN KEY ("icp_id") REFERENCES "public"."icps"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personas_icp_id_idx" ON "personas" USING btree ("icp_id");