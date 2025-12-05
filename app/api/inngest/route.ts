import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { meetingsProcessing } from "@/inngest/functions/meeting-processing";
import { persistAgentConnection } from "@/inngest/functions/persist-agent-connection";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [persistAgentConnection, meetingsProcessing],
});
