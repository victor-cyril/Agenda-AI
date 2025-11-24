import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import AgentIdView from "@/modules/agents/ui/views/agents-id-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ agentId: string }>;
};

const AgentIdPage = async (props: Props) => {
  const params = await props.params;
  const agentId = params.agentId;

  prefetch(trpc.agents.getOne.queryOptions({ id: agentId }));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Error loading agent"
            description="Something went wrong"
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="Loading Agent"
              description="Please wait while the agent loads..."
            />
          }
        >
          <AgentIdView agentId={agentId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default AgentIdPage;
