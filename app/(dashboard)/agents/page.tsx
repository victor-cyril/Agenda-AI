import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { validateSession } from "@/lib/server-utils";
import { loadSearchParams } from "@/modules/agents/params";
import AgentsListHeader from "@/modules/agents/ui/components/agents-list-header";
import AgentsView from "@/modules/agents/ui/views/agents-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AgentsPage = async (props: Props) => {
  await validateSession();
  const filters = await loadSearchParams(props.searchParams);

  prefetch(
    trpc.agents.getMany.queryOptions({
      ...filters,
    })
  );

  return (
    <>
      <AgentsListHeader />
      <HydrateClient>
        <ErrorBoundary
          fallback={
            <ErrorState
              title="Error loading agents"
              description="Please try again later."
            />
          }
        >
          <Suspense
            fallback={
              <LoadingState
                title="Loading Agents"
                description="Please wait while we fetch the agents."
              />
            }
          >
            <AgentsView />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </>
  );
};

export default AgentsPage;
