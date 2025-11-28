import { z } from "zod";

export const meetingInsertSchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character long").max(100),
  agentId: z.string().min(1, "Agent is required"),
});

export type MeetingInsertSchemaType = z.infer<typeof meetingInsertSchema>;

export const meetingUpdateSchema = meetingInsertSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type MeetingsUpdateSchemaType = z.infer<typeof meetingUpdateSchema>;
