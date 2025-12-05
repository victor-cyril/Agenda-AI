import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "agenda-ai" });

export const INNGEST_EVENTS = {
  PERSIST_AGENT_CONNECTION: "persist-agent-connection",
  MEETINGS_PROCESSING: "meetings/processing",
};
