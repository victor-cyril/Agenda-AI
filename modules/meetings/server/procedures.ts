import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { db } from "@/database";
import { agentTable, meetingTable, userTable } from "@/database/schemas";
import { PaginationResultDto } from "@/lib/pagination-util";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { meetingInsertSchema, meetingUpdateSchema } from "../schemas";
import { meetingStatus } from "../constants";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";
import { StreamTranscriptItem } from "../types";
import { streamChat } from "@/lib/stream-chat";

export const meetingsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const data = await db
        .select({
          ...getTableColumns(meetingTable),
          agent: getTableColumns(agentTable),
          duration: sql<number | null>`
            CASE
              WHEN ended_at IS NOT NULL AND started_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (ended_at - started_at))
              ELSE NULL
            END
          `.as("duration"),
        })
        .from(meetingTable)
        .innerJoin(agentTable, eq(meetingTable.agentId, agentTable.id))
        .where(
          and(
            eq(meetingTable.id, input.id),
            eq(meetingTable.userId, ctx.session.user.id)
          )
        );

      if (data.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Meetings not found`,
        });
      }

      return data[0];
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z.enum(meetingStatus).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, agentId, status } = input;
      const userId = ctx.session.user.id;

      const conditions = [
        eq(meetingTable.userId, userId),
        search ? ilike(meetingTable.name, `%${search}%`) : undefined,
        agentId ? eq(meetingTable.agentId, agentId) : undefined,
        status ? eq(meetingTable.status, status) : undefined,
      ].filter(Boolean);

      const data = await db
        .select({
          ...getTableColumns(meetingTable),
          agent: getTableColumns(agentTable),
          duration: sql<number | null>`
            CASE
              WHEN ended_at IS NOT NULL AND started_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (ended_at - started_at))
              ELSE NULL
            END
          `.as("duration"),
        })
        .from(meetingTable)
        // using inner join instead of left join because we don't want the agent to be null
        .innerJoin(agentTable, eq(meetingTable.agentId, agentTable.id))
        .where(and(...conditions))
        .orderBy(desc(meetingTable.createdAt), desc(meetingTable.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetingTable)
        .innerJoin(agentTable, eq(meetingTable.agentId, agentTable.id))
        .where(and(...conditions));

      const resultDto = new PaginationResultDto(data, total.count, {
        page,
        pageSize,
      });

      return resultDto.toJSON();
    }),

  create: protectedProcedure
    .input(meetingInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const user = ctx.session.user;
      const [createdMeeting] = await db
        .insert(meetingTable)
        .values({
          ...input,
          userId: user.id,
        })
        .returning();

      // Create stream call, upsert stream users
      const call = streamVideo.video.call("default", createdMeeting.id);
      await call.create({
        data: {
          created_by_id: user.id,
          custom: {
            meetingId: createdMeeting.id,
            meetingName: createdMeeting.name,
          },
          settings_override: {
            transcription: {
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });

      // Fetch agents based on the new meetings
      const existingAgentData = await db
        .select()
        .from(agentTable)
        .where(eq(agentTable.id, createdMeeting.agentId));

      if (existingAgentData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Agent not found for this meeting`,
        });
      }

      const existingAgent = existingAgentData[0];

      // Add the user and the agent when the meeting is created
      await streamVideo.upsertUsers([
        {
          id: user.id,
          name: user.name || "Unnamed User",
          role: "admin",
          image:
            user.image ||
            generateAvatarUri({
              seed: user.name || "Unnamed User",
              variant: "initials",
            }),
        },
        {
          id: existingAgent.id,
          name: existingAgent.name,
          role: "user",
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: "botttsNeutral",
          }),
        },
      ]);

      return createdMeeting;
    }),

  update: protectedProcedure
    .input(meetingUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const data = await db
        .update(meetingTable)
        .set({
          ...updateData,
        })
        .where(
          and(
            eq(meetingTable.id, id),
            eq(meetingTable.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!data.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Meeting not found or you do not have permission to update it.",
        });
      }

      return data[0];
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const data = await db
        .delete(meetingTable)
        .where(
          and(
            eq(meetingTable.id, id),
            eq(meetingTable.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!data.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Meeting not found or you do not have permission to update it.",
        });
      }

      return data[0];
    }),

  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session.user;

    // // expirationTime is optional (by default the token is valid for an hour)
    // const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    // const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

    const token = streamVideo.generateUserToken({
      user_id: user.id,
      // exp: expirationTime,
      // iat: issuedAt,
      // validity_in_seconds: issuedAt
    });

    return token;
  }),
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session.user;

    const token = streamChat.createToken(user.id);
    await streamChat.upsertUser({
      id: user.id,
      role: "admin",
    });

    return token;
  }),

  getTranscript: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input, ctx }) => {
      const data = await db
        .select()
        .from(meetingTable)
        .where(
          and(
            eq(meetingTable.id, input.meetingId),
            eq(meetingTable.userId, ctx.session.user.id)
          )
        );

      if (data.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Meetings not found`,
        });
      }

      const transcriptData = data[0];
      if (!transcriptData.transcriptUrl) {
        return [];
      }

      let transcript: StreamTranscriptItem[] = [];
      try {
        const response = await fetch(transcriptData.transcriptUrl);
        const transcriptText = await response.text();
        transcript = JSONL.parse<StreamTranscriptItem>(transcriptText);
      } catch {
        transcript = [];
      }

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
            image: userTable.image,
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

      const newUserSpeakers = userSpeakers.map((u) => ({
        ...u,
        image:
          u.image ?? generateAvatarUri({ seed: u.name, variant: "initials" }),
      }));

      const newAgentSpeakers = agentSpeakers.map((a) => ({
        ...a,
        image: generateAvatarUri({ seed: a.name, variant: "botttsNeutral" }),
      }));

      const speakers = [...newUserSpeakers, ...newAgentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker)
          return {
            ...item,
            user: {
              name: "Unknown",
              image: generateAvatarUri({
                seed: "Unknown",
                variant: "initials",
              }),
            },
          };
        return { ...item, user: { name: speaker.name, image: speaker.image } };
      });
    }),
});
