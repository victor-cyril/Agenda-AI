import ResponsiveDialog from "@/components/responsive-dialog";
import React from "react";
import AgentsForm from "./agents-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NewAgentDialog = (props: Props) => {
  const { open, onOpenChange } = props;
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Agent"
      description="Configure your new agent by providing the necessary details below."
    >
      <AgentsForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};

export default NewAgentDialog;
