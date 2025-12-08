import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { validateSession } from "@/lib/server-utils";
import UpgradeView from "@/modules/premium/ui/views/upgrade-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const UpgradePage = async () => {
  await validateSession();

  prefetch(trpc.premium.getCurrentSubscriptionProduct.queryOptions());
  prefetch(trpc.premium.getProducts.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Error loading upgrade options"
            description="Something went wrong. Please try again"
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="Loading upgrade options..."
              description="This might take some time"
            />
          }
        >
          <UpgradeView />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default UpgradePage;
