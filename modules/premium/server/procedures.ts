import { db } from "@/database";
import { agentTable, meetingTable } from "@/database/schemas";
import { polarInstance } from "@/lib/polar";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { count, eq } from "drizzle-orm";

export const premiumRouter = createTRPCRouter({
  getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const customer = await polarInstance.customers.getStateExternal({
      externalId: user.id,
    });

    // Each customer can only have one active subscription
    const subscription = customer?.activeSubscriptions[0];

    // Don't return free usage if they have an active subscription
    if (subscription) return null;

    // Count the number of meetings the user has created
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

    return {
      meetingCount: Number(userMeetings[0].count || 0),
      agentCount: Number(userAgents[0].count || 0),
    };
  }),

  getProducts: protectedProcedure.query(async () => {
    const products = await polarInstance.products.list({
      isArchived: false,
      isRecurring: true,
      sorting: ["price_amount"],
      metadata: {
        ["product-type"]: "agenda-ai",
      },
    });

    return products.result.items;
  }),

  getCurrentSubscriptionProduct: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const customer = await polarInstance.customers.getStateExternal({
      externalId: user.id,
    });

    const subscription = customer?.activeSubscriptions[0];

    if (!subscription) return null;

    // If there is an active subscription, fetch the product details
    const product = await polarInstance.products.get({
      id: subscription.productId,
    });

    return product;
  }),
});
