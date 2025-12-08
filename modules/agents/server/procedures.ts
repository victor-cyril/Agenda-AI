import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { agentInsertSchema, agentUpdateSchema } from "../schemas";
import { z } from "zod";
import { and, desc, eq, getTableColumns, ilike, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { PaginationResultDto } from "@/lib/pagination-util";

export const agentsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const data = await db
        .select({
          ...getTableColumns(agentTable),
          meetingCount: db.$count(
            meetingTable,
            eq(meetingTable.agentId, agentTable.id)
          ),
        })
        .from(agentTable)
        .where(
          and(
            eq(agentTable.id, input.id),
            eq(agentTable.userId, ctx.session.user.id)
          )
        );

      if (data.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Agent not found`,
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize } = input;

      const userId = ctx.session.user.id;

      const data = await db
        .select({
          ...getTableColumns(agentTable),
          meetingCount: db.$count(
            meetingTable,
            eq(meetingTable.agentId, agentTable.id)
          ),
        })
        .from(agentTable)
        .where(
          and(
            eq(agentTable.userId, userId),
            search ? ilike(agentTable.name, `%${search}%`) : undefined
          )
        )
        .orderBy(desc(agentTable.createdAt), desc(agentTable.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(agentTable)
        .where(
          and(
            eq(agentTable.userId, userId),
            search ? ilike(agentTable.name, `%${search}%`) : undefined
          )
        );

      const resultDto = new PaginationResultDto(data, total.count, {
        page,
        pageSize,
      });

      return resultDto.toJSON();
    }),

  create: premiumProcedure("agents")
    .input(agentInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await db
        .insert(agentTable)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      return data[0];
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const data = await db
        .delete(agentTable)
        .where(
          and(
            eq(agentTable.id, input.id),
            eq(agentTable.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!data.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Agent not found or you do not have permission to delete it.",
        });
      }

      return true;
    }),

  update: protectedProcedure
    .input(agentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const data = await db
        .update(agentTable)
        .set({
          ...updateData,
        })
        .where(
          and(eq(agentTable.id, id), eq(agentTable.userId, ctx.session.user.id))
        )
        .returning();

      if (!data.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Agent not found or you do not have permission to update it.",
        });
      }

      return data[0];
    }),
});
