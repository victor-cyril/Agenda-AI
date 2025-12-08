import { db } from "@/database";
import {
  accountTable,
  sessionTable,
  userTable,
  verificationTable,
} from "@/database/schemas";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarInstance } from "./polar";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    polar({
      client: polarInstance,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          // products: [
          //   {
          //     productId: "123-456-789", // ID of Product from Polar Dashboard
          //     slug: "pro", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
          //   },
          // ],
          successUrl: "/upgrade",
          returnUrl: "/upgrade",

          authenticatedUsersOnly: true,
        }),
        portal(),
        // webhooks({
        //     secret: process.env.POLAR_WEBHOOK_SECRET,
        //     onCustomerStateChanged: (payload) => // Triggered when anything regarding a customer changes
        //     onOrderPaid: (payload) => // Triggered when an order was paid (purchase, subscription renewal, etc.)
        //     ...  // Over 25 granular webhook handlers
        //     onPayload: (payload) => // Catch-all for all events
        // })
      ],
    }),
  ],
});
