import { LoadingState } from "@/components/loading-state";
import { generateAvatarUri } from "@/lib/avatar";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import type { Channel as StreamChannel } from "stream-chat";

import {
  useCreateChatClient,
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
  ChannelHeader,
} from "stream-chat-react";

import "stream-chat-react/dist/css/v2/index.css";

type Props = {
  meetingId: string;
  meetingName: string;
  user: { id: string; name: string; image?: string | null };
};

const ChatUI = (props: Props) => {
  const { meetingId, user } = props;
  const trpc = useTRPC();

  const { mutateAsync: generateChatToken } = useMutation(
    trpc.meetings.generateChatToken.mutationOptions()
  );

  const [channel, setChannel] = useState<StreamChannel>();

  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      ...user,
      image:
        user.image ||
        generateAvatarUri({ seed: user.name, variant: "initials" }),
    },
  });

  useEffect(() => {
    if (!client) return;

    const channel = client.channel("messaging", meetingId, {
      members: [user.id],
    });

    queueMicrotask(() => {
      setChannel(channel);
    });
  }, [client, meetingId, user.id]);

  if (!client || !channel) {
    return (
      <LoadingState
        title="Loading chat..."
        description="Please wait while we load the chat"
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b">
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatUI;
