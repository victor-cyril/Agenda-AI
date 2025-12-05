import { validateSession } from "@/lib/server-utils";
import CallView from "@/modules/call/ui/views/call-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ meetingId: string }>;
}

export default async function Page(props: Props) {
  await validateSession();

  const params = await props.params;
  prefetch(trpc.meetings.getOne.queryOptions({ id: params.meetingId }));

  return (
    <HydrateClient>
      <CallView meetingId={params.meetingId} />
    </HydrateClient>
  );
}
