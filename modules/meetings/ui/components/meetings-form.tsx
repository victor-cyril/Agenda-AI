import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { meetingInsertSchema, MeetingInsertSchemaType } from "../../schemas";
import { MeetingGetOne } from "../../types";
import { useState } from "react";
import CommandSelect from "@/components/command-select";
import GeneratedAvatar from "@/components/generated-avatar";
import NewAgentDialog from "@/modules/agents/ui/components/new-agent-dialog";

type Props = {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: MeetingGetOne;
};

const MeetingsForm = (props: Props) => {
  const { onSuccess, onCancel, initialValues } = props;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");

  const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
      search: agentSearch,
    })
  );

  const agentsData = agents?.data?.data || [];

  const form = useForm<MeetingInsertSchemaType>({
    resolver: zodResolver(meetingInsertSchema),
    defaultValues: {
      name: initialValues?.name || "",
      agentId: initialValues?.agentId || "",
    },
  });

  const createMeeting = useMutation(
    trpc.meetings.create.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({})
        );

        // Invalidate free tier Usage

        toast.success("Meeting created successfully");
        onSuccess?.(data.id);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({})
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.meetings.getOne.queryOptions({ id: initialValues.id })
          );
        }

        toast.success("Meeting Updated successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);

        // redirect to upgrade
      },
    })
  );

  const isEdit = !!initialValues?.id;
  const isPending = createMeeting.isPending || updateMeeting.isPending;

  const onSubmit = async (data: MeetingInsertSchemaType) => {
    if (isEdit) {
      updateMeeting.mutate({ id: initialValues!.id, ...data });
      return;
    }

    createMeeting.mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>

                <FormControl>
                  <Input placeholder="e.g Consultations" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>

                <FormControl>
                  <CommandSelect
                    value={field.value}
                    placeholder="Select an agent"
                    options={agentsData?.map((agent) => ({
                      id: agent.id,
                      value: agent.id,
                      children: (
                        <div className="flex items-center gap-x-2 px-2">
                          <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="border size-6"
                          />
                          <span>{agent.name}</span>
                        </div>
                      ),
                    }))}
                    onSelect={field.onChange}
                    onSearch={setAgentSearch}
                  />
                </FormControl>
                <FormDescription>
                  Not found what you&apos;are looking for?
                  <button
                    type="button"
                    className="text-primary hover:underline inline ml-2"
                    onClick={() => setOpenAgentDialog(true)}
                  >
                    Create new agent
                  </button>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-7! flex justify-between gap-x-2">
            {onCancel && (
              <Button
                variant="outline"
                disabled={isPending}
                type="button"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button disabled={isPending} type="submit">
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>

      <NewAgentDialog
        open={openAgentDialog}
        onOpenChange={setOpenAgentDialog}
      />
    </>
  );
};

export default MeetingsForm;
