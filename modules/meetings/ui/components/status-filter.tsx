import { meetingStatusType } from "@/database/schemas";
import React from "react";
import { statusIconMap } from "./columns";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import CommandSelect from "@/components/command-select";

const StatusFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-9"
      options={statusOptions}
      onSelect={(value) => setFilters({ status: value as meetingStatusType })}
      value={filters.status || ""}
    />
  );
};

export default StatusFilter;

const StatusChildren = (props: { status: meetingStatusType }) => {
  const Icon = statusIconMap[props.status];
  return (
    <div className="flex items-center gap-x-2 capitalize">
      <Icon />
      {props.status}
    </div>
  );
};

const statusOptions: Array<{
  id: meetingStatusType;
  value: meetingStatusType;
  children: React.ReactNode;
}> = [
  {
    id: "upcoming",
    value: "upcoming",
    children: <StatusChildren status="upcoming" />,
  },
  {
    id: "completed",
    value: "completed",
    children: <StatusChildren status="completed" />,
  },
  {
    id: "active",
    value: "active",
    children: <StatusChildren status="active" />,
  },
  {
    id: "processing",
    value: "processing",
    children: <StatusChildren status="processing" />,
  },
  {
    id: "cancelled",
    value: "cancelled",
    children: <StatusChildren status="cancelled" />,
  },
];
