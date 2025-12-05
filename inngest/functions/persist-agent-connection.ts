/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest, INNGEST_EVENTS } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video";

export const persistAgentConnection = inngest.createFunction(
  { id: INNGEST_EVENTS.PERSIST_AGENT_CONNECTION },
  { event: INNGEST_EVENTS.PERSIST_AGENT_CONNECTION },
  async ({ event }) => {
    const { meetingId, agentId, instructions } = event.data;

    // Fetch the call
    const call = streamVideo.video.call("default", meetingId);

    // Connect the agent
    const realtime = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: agentId,
    });

    console.log("Agent connected for meeting", meetingId);

    // Update the session
    realtime.updateSession({
      // voice: "alloy",
      instructions,
    });

    realtime.on("error", (event: any) => {
      console.error("Error:", event);
    });

    realtime.on("session.update", (event: any) => {
      console.log("Realtime session update:", event);
    });

    // Send a message to trigger a generation
    realtime.sendUserMessageContent([{ type: "input_text", text: "Hello?" }]);

    // realtime.on("conversation.updated", (event) => {
    //   console.log(`received conversation.updated`, event);
    // });

    // realtime.on("conversation.item.completed", ({ item }) => {
    //   console.log(`received conversation.item.completed`, event);
    // });

    // realtime.on("error", (error: any) => {
    //   console.log(`received error`, error);
    // });

    // // Listen for call end events
    // realtime.on("call.ended", () => {
    //   console.log(`Call ${meetingId} ended`);
    // });

    // // Listen for Stream Video events to maintain connection
    // realtime.on("call.session_participant_left", (ev: any) => {
    //   console.log("Participant left", ev.participant.user.id);
    //   // Optionally detect if no humans left and terminate early
    // });
  }
);
