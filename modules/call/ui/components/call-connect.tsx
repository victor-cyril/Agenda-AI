"use client";

import { useTRPC } from "@/trpc/client";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { LoaderIcon } from "lucide-react";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import CallUI from "./call-ui";

interface Props {
  meetingId: string;
  meetingName: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

const CallConnect = (props: Props) => {
  const { meetingId, meetingName, user } = props;
  const trpc = useTRPC();
  const { mutateAsync: generateToken } = useMutation(
    trpc.meetings.generateToken.mutationOptions()
  );
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user,
      tokenProvider: generateToken,
    });

    queueMicrotask(() => {
      setClient(_client);
    });

    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, [generateToken, user]);

  const [call, setCall] = useState<Call>();

  useEffect(() => {
    if (!client) return;

    const _call = client.call("default", meetingId);
    // disable camera and microphone by default for this user
    _call.camera.disable();
    _call.microphone.disable();

    queueMicrotask(() => {
      setCall(_call);
    });

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
        _call.endCall();
        setCall(undefined);
      }
    };
  }, [client, meetingId]);

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};

export default CallConnect;
