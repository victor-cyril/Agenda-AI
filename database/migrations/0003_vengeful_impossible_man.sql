CREATE TABLE "processed_meeting" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "processed_meeting" ADD CONSTRAINT "processed_meeting_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;