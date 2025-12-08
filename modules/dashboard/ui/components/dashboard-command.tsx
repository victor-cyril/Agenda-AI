import GeneratedAvatar from "@/components/generated-avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { Dispatch, SetStateAction, useState } from "react";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const DashboardCommand = (props: Props) => {
  const { open, setOpen } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");

  const trpc = useTRPC();
  const meetings = useQuery(
    trpc.meetings.getMany.queryOptions({
      search,
      pageSize: 100,
    })
  );
  const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      search,
      pageSize: 100,
    })
  );

  return (
    <CommandDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Find a meeting for agent..."
        value={search}
        onValueChange={setSearch}
      />

      <CommandList>
        <CommandGroup heading="Meetings">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No meetings found
            </span>
          </CommandEmpty>

          {meetings.data?.data.map((meeting) => (
            <CommandItem
              key={meeting.id}
              onSelect={() => {
                router.push(`/meetings/${meeting.id}`);
                setOpen(false);
              }}
            >
              {meeting.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Agents">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No agents found
            </span>
          </CommandEmpty>

          {agents.data?.data.map((agent) => (
            <CommandItem
              key={agent.id}
              onSelect={() => {
                router.push(`/agents/${agent.id}`);
                setOpen(false);
              }}
            >
              <GeneratedAvatar
                seed={agent.name}
                variant="botttsNeutral"
                className="size-5"
              />
              {agent.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default DashboardCommand;
