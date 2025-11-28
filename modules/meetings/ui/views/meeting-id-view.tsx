"use client";

import { useConfirmation } from "@/hooks/use-confirmation";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import UpcomingState from "../components/upcoming-state";
import UpdateMeetingDialog from "../components/update-meeting-dialog";
import MeetingIdViewHeader from "./meeting-id-view-header";
import ActiveState from "../components/active-state";
import CancelledState from "../components/cancelled-state";
import ProcessingState from "../components/processing-state";

type Props = {
  meetingId: string;
};

const MeetingIdView = (props: Props) => {
  const { meetingId } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );
  const [RemoveConfirmationDialog, confirmRemove] = useConfirmation({
    title: "Are you sure?",
    description: `The following action cannot be undone.`,
  });
  const [updateMeetingDialog, setUpdateMeetingDialog] = useState(false);

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({})),
          // Invalidate free tier Usage
        ]);

        toast.success("Successfully deleted meeting");
        router.push("/meetings");
      },
      onError: (error) => {
        toast.error("Error removing meeting: " + error.message);
      },
    })
  );

  const handleRemoveMeeting = async () => {
    const confirmed = await confirmRemove();
    if (!confirmed) return;

    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      <RemoveConfirmationDialog />

      <UpdateMeetingDialog
        open={updateMeetingDialog}
        onOpenChange={setUpdateMeetingDialog}
        initialValues={data}
      />

      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialog(true)}
          onRemove={handleRemoveMeeting}
        />

        {isCancelled && <CancelledState />}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}

        {isCompleted && <div>Completed</div>}
        {isProcessing && <ProcessingState />}
      </div>
    </>
  );
};

export default MeetingIdView;
