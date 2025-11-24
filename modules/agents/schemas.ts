import { z } from "zod";

export const agentInsertSchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character long").max(100),
  instructions: z
    .string()
    .min(1, "Instructions must be at least 1 character long")
    .max(1000),
});

export type AgentInsertSchemaType = z.infer<typeof agentInsertSchema>;
