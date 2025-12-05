import { db } from "@/database";
import { agentTable, meetingTable, userTable } from "@/database/schemas";
import { inngest, INNGEST_EVENTS } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

const summarizer = createAgent({
  name: "summarizer",
  system: `
You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
`.trim(),
  model: openai({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY!,
  }),
});

export const meetingsProcessing = inngest.createFunction(
  { id: INNGEST_EVENTS.MEETINGS_PROCESSING },
  { event: INNGEST_EVENTS.MEETINGS_PROCESSING },
  async ({ event, step }) => {
    // Summarize the transcript meetings
    // first step - fetch the transcript
    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    // second step - parse the transcript
    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    // third step - add speakers to the transcript
    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(
          transcript.filter((i) => i.speaker_id).map((item) => item.speaker_id)
        ),
      ];

      const [userSpeakers, agentSpeakers] = await Promise.all([
        db
          .select({
            id: userTable.id,
            name: userTable.name,
          })
          .from(userTable)
          .where(inArray(userTable.id, speakerIds)),
        db
          .select({
            id: agentTable.id,
            name: agentTable.name,
          })
          .from(agentTable)
          .where(inArray(agentTable.id, speakerIds)),
      ]);

      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) return { ...item, user: { name: "Unknown" } };
        return { ...item, user: { name: speaker.name } };
      });
    });

    // fourth step - summarize the transcript
    const { output } = await summarizer.run(
      `Summarize the following transcript: ${JSON.stringify(
        transcriptWithSpeakers
      )}`
    );

    const firstOutput = output[0] as TextMessage | undefined;

    if (
      firstOutput &&
      typeof firstOutput === "object" &&
      "content" in firstOutput &&
      typeof firstOutput.content === "string"
    ) {
      // fifth step - save the summary to the database
      await step.run("save-summary", async () => {
        await db
          .update(meetingTable)
          .set({ summary: firstOutput.content as string, status: "completed" })
          .where(eq(meetingTable.id, event.data.meetingId));
      });
    }
  }
);
