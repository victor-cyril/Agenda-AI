"use client";
import ResponsiveDialog from "@/components/responsive-dialog";
import React from "react";
import MeetingsForm from "./meetings-form";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NewMeetingDialog = (props: Props) => {
  const { open, onOpenChange } = props;
  const router = useRouter();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Meeting"
      description="Configure your new meeting by providing the necessary details below."
    >
      <MeetingsForm
        onSuccess={(id) => {
          onOpenChange(false);
          if (id) {
            router.push(`/meetings/${id}`);
          }
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};

export default NewMeetingDialog;
