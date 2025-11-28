import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import MeetingIdView from "@/modules/meetings/ui/views/meeting-id-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ meetingId: string }>;
};

const MeetingIdPage = async (props: Props) => {
  const params = await props.params;
  const meetingId = params.meetingId;

  prefetch(trpc.meetings.getOne.queryOptions({ id: meetingId }));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Error loading meeting"
            description="Something went wrong"
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="Loading Meeting"
              description="Please wait while the meeting loads..."
            />
          }
        >
          <MeetingIdView meetingId={meetingId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default MeetingIdPage;
