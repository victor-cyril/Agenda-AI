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

      await inngest.send({
        name: INNGEST_EVENTS.NEW_CHAT_MESSAGE,
        data: { userId, channelId, text },
      });

      break;
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
