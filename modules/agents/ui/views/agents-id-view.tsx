"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import AgentIdViewHeader from "./agent-id-view-header";
import GeneratedAvatar from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirmation } from "@/hooks/use-confirmation";
import { useState } from "react";
import UpdateAgentDialog from "../components/update-agent-dialog";

type Props = {
  agentId: string;
};

const AgentIdView = (props: Props) => {
  const { agentId } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.agents.getOne.queryOptions({ id: agentId })
  );
  const [RemoveConfirmationDialog, confirmRemove] = useConfirmation({
    title: "Are you sure?",
    description: `The following action would remove ${data.meetingCount} associated meetings and cannot be undone.`,
  });
  const [updateAgentDialog, setUpdateAgentDialog] = useState(false);

  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({})),
          // Invalidate free tier Usage
        ]);

        toast.success("Successfully deleted agent");
        router.push("/agents");
      },
      onError: (error) => {
        toast.error("Error removing agent: " + error.message);
      },
    })
  );

  const handleRemoveAgent = async () => {
    const confirmed = await confirmRemove();
    if (!confirmed) return;

    await removeAgent.mutateAsync({ id: agentId });
  };

  return (
    <>
      <RemoveConfirmationDialog />

      <UpdateAgentDialog
        open={updateAgentDialog}
        onOpenChange={setUpdateAgentDialog}
        initialValues={data}
      />

      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialog(true)}
          onRemove={handleRemoveAgent}
        />

        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
            <div className="flex items-center gap-x-3">
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={data.name}
                className="size-10"
              />
              <h2 className="text-2xl font-medium">{data.name}</h2>
            </div>

            <Badge
              variant="outline"
              className="flex items-center gap-x-2 [&>svg]:size-4"
            >
              <VideoIcon className="text-blue-700" />
              {data.meetingCount}{" "}
              {data.meetingCount === 1 ? "meeting" : "meetings"}
            </Badge>

            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instructions</p>
              <p className="text-neutral-800">{data.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentIdView;
