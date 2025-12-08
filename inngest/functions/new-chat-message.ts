import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import { inngest, INNGEST_EVENTS } from "@/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { openaiClient } from "@/lib/openai-client";
import { streamChat } from "@/lib/stream-chat";
import { and, eq, getTableColumns } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export const newChatMessage = inngest.createFunction(
  { id: INNGEST_EVENTS.NEW_CHAT_MESSAGE },
  { event: INNGEST_EVENTS.NEW_CHAT_MESSAGE },
  async ({ event, step }) => {
    const { userId, channelId, text } = event.data;

    // Summarize the transcript meetings
    // first step - fetch the transcript
    const existingMeeting = await step.run("find-meeting", async () => {
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

      if (meetings.length === 0) return;

      return meetings[0];
    });

    if (!existingMeeting) {
      console.log(
        `No completed meeting found for channelId: ${channelId}, skipping summarization.`
      );
      return;
    }

    const existingAgent = existingMeeting.agent;

    if (userId === existingAgent.id) {
      // Message is from the agent, ignore
      console.log(`Message from agent ${userId}, ignoring.`);
      return;
    }

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
    const GPTResponse = await step.run("generate-gpt-response", () =>
      openaiClient.chat.completions.create({
        messages: [
          { role: "system", content: instructions },
          ...previousMessages,
          { role: "user", content: text },
        ],
        model: "gpt-4o",
      })
    );

    const GPTResponseText = GPTResponse.choices[0].message.content;

    if (!GPTResponseText) {
      console.log("No GPT response generated, skipping.");
      return;
    }

    const avatarUrl = generateAvatarUri({
      seed: existingAgent.name,
      variant: "botttsNeutral",
    });

    // Update the user image
    const data = await step.run("update-user-image", async () => {
      await streamChat.upsertUser({
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      });

      // Send the message
      await channel.sendMessage({
        text: GPTResponseText,
        user: {
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl,
        },
      });
    });

    return data;
  }
);
