import ResponsiveDialog from "@/components/responsive-dialog";
import React from "react";
import MeetingsForm from "./meetings-form";
import { MeetingGetOne } from "../../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: MeetingGetOne;
};

const UpdateMeetingDialog = (props: Props) => {
  const { open, onOpenChange, initialValues } = props;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Meeting"
      description="Update your meeting's details below."
    >
      <MeetingsForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};

export default UpdateMeetingDialog;
