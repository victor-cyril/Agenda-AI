import GeneratedAvatar from "@/components/generated-avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { agentInsertSchema, AgentInsertSchemaType } from "../../schemas";
import { AgentGetOne } from "../../types";
import { useRouter } from "next/navigation";

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
};

const AgentsForm = (props: Props) => {
  const { onSuccess, onCancel, initialValues } = props;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({})),
          // Invalidate free tier Usage
          queryClient.invalidateQueries(
            trpc.premium.getFreeUsage.queryOptions()
          ),
        ]);

        toast.success("Agent created successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);

        if (error?.data?.code === "FORBIDDEN") {
          // redirect to upgrade
          router.push("/upgrade");
        }
      },
    })
  );

  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id })
          );
        }

        toast.success("Agent Updated successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);

        // redirect to upgrade
      },
    })
  );

  const form = useForm<AgentInsertSchemaType>({
    resolver: zodResolver(agentInsertSchema),
    defaultValues: {
      name: initialValues?.name || "",
      instructions: initialValues?.instructions || "",
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = async (data: AgentInsertSchemaType) => {
    if (isEdit) {
      updateAgent.mutate({ id: initialValues!.id, ...data });
      return;
    }

    createAgent.mutate(data);
  };

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          seed={watchedName}
          variant="botttsNeutral"
          className="border size-16"
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>

              <FormControl>
                <Input placeholder="e.g John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>

              <FormControl>
                <Textarea
                  placeholder="e.g You are a helpful math assistant that can answer questions and help with assignments"
                  {...field}
                />
              </FormControl>
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
  );
};

export default AgentsForm;
