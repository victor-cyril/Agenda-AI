"use client";

import { ErrorState } from "@/components/error-state";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import CallConnect from "../components/call-connect";

type Props = {
  meetingId: string;
};

const CallView = (props: Props) => {
  const { meetingId } = props;
  const trpc = useTRPC();
  const data = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  const meetingData = data.data;

  if (meetingData.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Meeting has ended"
          description="You can no longer join this meeting"
        />
      </div>
    );
  }

  const { data: session, isPending } = authClient.useSession();
  if (!session || isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  const user = session.user;

  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingData.name}
      user={{
        ...user,
        image:
          user.image ??
          generateAvatarUri({ seed: user.name, variant: "initials" }),
      }}
    />
  );
};

export default CallView;
