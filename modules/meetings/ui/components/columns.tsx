"use client";

import GeneratedAvatar from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { meetingStatusType } from "@/database/schemas";
import { cn, formatDuration } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import {
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  CornerDownRightIcon,
  LoaderIcon,
  LucideIcon,
} from "lucide-react";
import { MeetingGetManyData } from "../../types";

export const statusIconMap: Record<meetingStatusType, LucideIcon> = {
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  processing: LoaderIcon,
  cancelled: CircleXIcon,
};

const statusColorMap: Record<meetingStatusType, string> = {
  upcoming: "bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
  active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
  completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
  processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
  cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
};

export const columns: ColumnDef<MeetingGetManyData>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => {
      const newRow = row.original;
      return (
        <div className="flex flex-col gap-y-1">
          <span className="font-semibold capitalize">{newRow.name}</span>

          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-x-1">
              <CornerDownRightIcon className="size-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
                {newRow.agent.name}
              </span>
            </div>

            <GeneratedAvatar
              seed={newRow.agent.name}
              variant="botttsNeutral"
              className="size-4"
            />
            <span className="text-sm text-muted-foreground">
              {newRow.startedAt ? format(newRow.startedAt, "MMM d") : ""}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const newRow = row.original;
      const Icon = statusIconMap[newRow.status];

      return (
        <Badge
          variant="outline"
          className={cn(
            `capitalize [&>svg]:size-4 text-muted-foreground`,
            statusColorMap[newRow.status]
          )}
        >
          <Icon
            className={cn(newRow.status === "processing" && "animate-spin")}
          />
          <span className="capitalize">{newRow.status}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const newRow = row.original;

      return (
        <Badge
          variant="outline"
          className={cn(`capitalize [&>svg]:size-4 flex items-center gap-x-2`)}
        >
          <ClockFadingIcon className="text-blue-700" />
          {newRow?.duration ? formatDuration(newRow.duration) : "No duration"}
        </Badge>
      );
    },
  },
];
