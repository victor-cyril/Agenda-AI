"use client";

import { LoadingState } from "@/components/loading-state";
import { authClient } from "@/lib/auth-client";
import ChatUI from "./chat-ui";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const ChatProvider = (props: Props) => {
  const { meetingId, meetingName } = props;

  const { data: session, isPending } = authClient.useSession();

  if (isPending || !session?.user) {
    return (
      <LoadingState
        title="Loading chat..."
        description="Please wait while we load the chat"
      />
    );
  }

  return (
    <ChatUI
      meetingId={meetingId}
      meetingName={meetingName}
      user={session.user}
    />
  );
};
