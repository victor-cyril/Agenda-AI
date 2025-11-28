import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { validateSession } from "@/lib/server-utils";
import { loadSearchParams } from "@/modules/meetings/params";
import MeetingsListHeader from "@/modules/meetings/ui/components/meetings-list-header";
import MeetingsView from "@/modules/meetings/ui/views/meetings-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
};

const MeetingsPage = async (props: Props) => {
  await validateSession();
  const filters = await loadSearchParams(props.searchParams);
  prefetch(
    trpc.meetings.getMany.queryOptions({
      ...filters,
    })
  );

  return (
    <>
      <MeetingsListHeader />
      <HydrateClient>
        <ErrorBoundary
          fallback={
            <ErrorState
              title="Error loading meetings"
              description="Something went wrong. Please try again"
            />
          }
        >
          <Suspense
            fallback={
              <LoadingState
                title="Loading meetings..."
                description="This might take some time"
              />
            }
          >
            <MeetingsView />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </>
  );
};

export default MeetingsPage;
