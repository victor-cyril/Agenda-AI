import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import { PaginationResultDto } from "@/lib/pagination-util";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { meetingInsertSchema, meetingUpdateSchema } from "../schemas";
import { meetingStatus } from "../constants";

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
      const data = await db
        .insert(meetingTable)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      // Create stream call, upsert stream users

      return data[0];
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
});
