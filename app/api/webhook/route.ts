import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import { inngest, INNGEST_EVENTS } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video";
import {
  MessageNewEvent,
  CallRecordingReadyEvent,
  CallSessionEndedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
  WebhookEvent,
} from "@stream-io/node-sdk";
import { and, eq, getTableColumns } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { openaiClient } from "@/lib/openai-client";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature") || "";
  const apiKey = req.headers.get("x-api-key") || "";

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or api key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  const isValid = verifySignatureWithSDK(body, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookEvent;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload?.type;

  switch (eventType) {
    case "call.session_started": {
      const event = payload as CallSessionStartedEvent;
      const meetingId = event.call.custom?.meetingId;

      console.log("Called session started event", meetingId);

      if (!meetingId) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      const [existingMeeting] = await db
        .select()
        .from(meetingTable)
        .where(
          and(
            eq(meetingTable.id, meetingId),
            eq(meetingTable.status, "upcoming")
          )
        );

      if (!existingMeeting) {
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        );
      }

      // update the meeting to active
      await db
        .update(meetingTable)
        .set({
          status: "active",
          startedAt: new Date(),
        })
        .where(eq(meetingTable.id, existingMeeting.id));

      // find agent for that meeting
      const [existingAgent] = await db
        .select()
        .from(agentTable)
        .where(eq(agentTable.id, existingMeeting.agentId));

      if (!existingAgent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      const call = streamVideo.video.call("default", meetingId);

      const realtime = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingMeeting.agentId,
      });

      console.log("[AGENT] Connected to meeting:", meetingId);

      realtime.updateSession({
        voice: "alloy",
        instructions: existingAgent.instructions,
      });

      realtime.sendUserMessageContent([{ type: "input_text", text: "Hello?" }]);

      // Keep the connection alive until the call ends
      // await new Promise<void>((resolve) => {
      //   realtime.on("call.ended", () => {
      //     console.log("[AGENT] Call ended");
      //     resolve();
      //   });
      //   realtime.on("error", (err: any) => {
      //     console.error("[AGENT] Realtime error:", err);
      //   });
      // });

      // send inngest event to persist the meeting agent connections
      // await inngest.send({
      //   name: INNGEST_EVENTS.PERSIST_AGENT_CONNECTION,
      //   data: {
      //     meetingId,
      //     agentId: existingMeeting.agentId,
      //     instructions: existingAgent.instructions,
      //   },
      // });

      break;
    }

    case "call.session_ended": {
      const event = payload as CallSessionEndedEvent;
      const meetingId = event.call.custom?.meetingId;

      console.log("Called session ended event", meetingId);

      if (!meetingId) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      await db
        .update(meetingTable)
        .set({
          status: "processing",
          endedAt: new Date(),
        })
        .where(
          and(eq(meetingTable.id, meetingId), eq(meetingTable.status, "active"))
        );

      break;
    }

    case "call.transcription_ready": {
      const event = payload as CallTranscriptionReadyEvent;
      const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

      console.log("Called transcription ready event", meetingId);

      if (!meetingId) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      if (event.call_transcription?.url) {
        const [updatedMeeting] = await db
          .update(meetingTable)
          .set({
            transcriptUrl: event.call_transcription.url,
          })
          .where(eq(meetingTable.id, meetingId))
          .returning();

        if (!updatedMeeting) {
          return NextResponse.json(
            { error: "Failed to update meeting" },
            { status: 400 }
          );
        }

        // Todo: call ingest background to summarize the transcript.
        if (updatedMeeting.transcriptUrl) {
          await inngest.send({
            name: INNGEST_EVENTS.MEETINGS_PROCESSING,
            data: {
              meetingId: updatedMeeting.id,
              transcriptUrl: updatedMeeting.transcriptUrl,
            },
          });
        }
      }

      break;
    }

    case "call.recording_ready": {
      const event = payload as CallRecordingReadyEvent;
      const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

      console.log("Called recording ready event", meetingId);

      if (!meetingId) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      if (event.call_recording?.url) {
        await db
          .update(meetingTable)
          .set({
            recordingUrl: event.call_recording.url,
          })
          .where(eq(meetingTable.id, meetingId));
      }

      break;
    }

    // If any participant leaves the call.
    // In our own case, we end the call, because there is no need to have only one user in the call
    case "call.session_participant_left": {
      const event = payload as CallSessionParticipantLeftEvent;
      const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

      console.log("Called session participant left event", meetingId);

      if (!meetingId) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      const call = streamVideo.video.call("default", meetingId);
      await call.end();

      break;
    }

    case "message.new": {
      const event = payload as MessageNewEvent;
      console.log("Called message new event", event.cid);

      const userId = event.user?.id;
      const channelId = event.channel_id;
      const text = event.message?.text || "";

      if (!userId || !channelId || !text) {
        return NextResponse.json(
          { error: "Missing information" },
          { status: 400 }
        );
      }

      const meetings = await db
        .select({
          ...getTableColumns(meetingTable),
          agent: getTableColumns(agentTable),
        })
        .from(meetingTable)
        .innerJoin(agentTable, eq(meetingTable.agentId, agentTable.id))
        .where(
          and(
            eq(meetingTable.id, channelId),
            eq(meetingTable.status, "completed")
          )
        );

      if (meetings.length === 0) {
        // No meeting found, ignore the message
        return NextResponse.json(
          {
            error: "Meeting not found or not completed",
          },
          { status: 404 }
        );
      }

      const existingMeeting = meetings[0];
      const existingAgent = existingMeeting.agent;

      console.log("Here...", userId, existingAgent.id);

      if (userId !== existingAgent.id) {
        // Message is not from the agent, ignore
        const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:

      ${existingMeeting.summary}

      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:

      ${existingAgent.instructions}

      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.

      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

      If the summary does not contain enough information to answer a question, politely let the user know.

      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
      `;

        const channel = streamChat.channel("messaging", channelId);
        await channel.watch();

        const previousMessages = channel.state.messages
          .slice(-5)
          .filter((msg) => msg.text && msg.text.trim() !== "")
          .map<ChatCompletionMessageParam>((msg) => ({
            role: msg.user?.id === existingAgent.id ? "assistant" : "user",
            content: msg.text || "",
          }));

        // Generate chatgpt response
        const GPTResponse = await openaiClient.chat.completions.create({
          messages: [
            { role: "system", content: instructions },
            ...previousMessages,
            { role: "user", content: text },
          ],
          model: "gpt-4o",
        });

        const GPTResponseText = GPTResponse.choices[0].message.content;

        if (!GPTResponseText) {
          return NextResponse.json(
            { error: "Failed to generate response" },
            { status: 500 }
          );
        }

        const avatarUrl = generateAvatarUri({
          seed: existingAgent.name,
          variant: "botttsNeutral",
        });

        // Update the user image
        streamChat.upsertUser({
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl,
        });

        // Send the message
        channel.sendMessage({
          text: GPTResponseText,
          user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
          },
        });
      }

      break;
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
