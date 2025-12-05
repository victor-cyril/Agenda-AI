import React from "react";

import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import { authClient } from "@/lib/auth-client";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { generateAvatarUri } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  onJoin: () => void;
};

const CallLobby = (props: Props) => {
  const { onJoin } = props;

  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">Ready to join?</h6>
            <p className="text-sm">Set up your call before joining</p>
          </div>

          <VideoPreview
            DisabledVideoPreview={
              hasBrowserMediaPermission
                ? DisabledVideoPreview
                : AllowBrowserPermissions
            }
          />

          <div className="flex gap-x-2 ">
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
          </div>

          <div className="flex gap-x-2 justify-between w-full">
            <Button asChild variant="ghost">
              <Link href="/meetings">Cancel</Link>
            </Button>
            <Button onClick={onJoin}>
              <LogInIcon />
              Join Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLobby;

const DisabledVideoPreview = () => {
  const { data: session } = authClient.useSession();

  const user = session?.user;
  const userName = user?.name || "Un-named User";
  return (
    <DefaultVideoPlaceholder
      participant={
        {
          name: userName,
          image:
            user?.image ||
            generateAvatarUri({
              seed: userName,
              variant: "initials",
            }),
        } as StreamVideoParticipant
      }
    />
  );
};

const AllowBrowserPermissions = () => {
  return (
    <p className="text-sm">
      Please grant your browser a permission to access your camera and
      microphone
    </p>
  );
};
