import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { userTable } from "./auth-schema";
import { agentTable } from "./agent-schema";

export type meetingStatusType =
  | "upcoming"
  | "active"
  | "completed"
  | "processing"
  | "cancelled";

export const meetingTable = pgTable("meeting", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentTable.id, { onDelete: "cascade" }),
  status: text("meeting_status")
    .$type<meetingStatusType>()
    .default("upcoming")
    .notNull(),
  transcriptUrl: text("transcript_url"),
  recordingUrl: text("recording_url"),
  summary: text("summary"),

  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
