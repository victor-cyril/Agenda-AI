import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import { polarInstance } from "@/lib/polar";
import { getServerSession } from "@/lib/server-utils";
import {
  MAX_FREE_AGENTS,
  MAX_FREE_MEETINGS,
} from "@/modules/premium/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await getServerSession();
  if (!session || !session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not authenticated",
    });
  }

  return next({
    ctx: { ...ctx, session },
  });
});

export const premiumProcedure = (entity: "meetings" | "agents") =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const user = ctx.session.user;
    const customer = await polarInstance.customers.getStateExternal({
      externalId: user.id,
    });

    const [userMeetings, userAgents] = await Promise.all([
      db
        .select({
          count: count(meetingTable.id),
        })
        .from(meetingTable)
        .where(eq(meetingTable.userId, user.id)),
      db
        .select({
          count: count(agentTable.id),
        })
        .from(agentTable)
        .where(eq(agentTable.userId, user.id)),
    ]);

    const existingMeeting = Number(userMeetings[0].count || 0);
    const existingAgent = Number(userAgents[0].count || 0);

    const isPremium = customer.activeSubscriptions.length > 0;
    const isFreeMeetingLimitReached = existingMeeting >= MAX_FREE_MEETINGS;
    const isFreeAgentLimitReached = existingAgent >= MAX_FREE_AGENTS;

    const shouldThrowMeetingError =
      entity === "meetings" && isFreeMeetingLimitReached && !isPremium;
    const shouldThrowAgentError =
      entity === "agents" && isFreeAgentLimitReached && !isPremium;

    if (shouldThrowMeetingError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Free meeting limit of ${MAX_FREE_MEETINGS} reached. Please upgrade to create more meetings.`,
      });
    }

    if (shouldThrowAgentError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Free agent limit of ${MAX_FREE_AGENTS} reached. Please upgrade to create more agents.`,
      });
    }

    return next({ ctx: { ...ctx, customer } });
  });
