import ResponsiveDialog from "@/components/responsive-dialog";
import React from "react";
import AgentsForm from "./agents-form";
import { AgentGetOne } from "../../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: AgentGetOne;
};

const UpdateAgentDialog = (props: Props) => {
  const { open, onOpenChange, initialValues } = props;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Agent"
      description="Update your agent's details below."
    >
      <AgentsForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};

export default UpdateAgentDialog;
