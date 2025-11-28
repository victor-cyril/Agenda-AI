import React, { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

interface Props {
  value: string;
  options: Array<{
    id: string;
    value: string;
    children: React.ReactNode;
  }>;
  onSelect: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
}

const CommandSelect = (props: Props) => {
  const {
    value,
    options,
    onSelect,
    onSearch,
    placeholder = "Select an option",
    isSearchable,
    className,
  } = props;
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const handleOpenChange = (value: boolean) => {
    onSearch?.("");
    setOpen(value);
  };

  return (
    <>
      <Button
        type="button"
        variant={"outline"}
        onClick={() => setOpen(true)}
        className={cn(
          "h-9 justify-between font-normal px-2",
          !selectedOption && "text-muted-foreground",
          className
        )}
      >
        <div>{selectedOption?.children ?? placeholder}</div>
        <ChevronsUpDownIcon />
      </Button>

      <CommandDialog
        shouldFilter={!onSearch}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <CommandInput placeholder="Search..." onValueChange={onSearch} />
        <CommandList className="py-2">
          <CommandEmpty className="text-muted-foreground text-sm w-full text-center p-3">
            <span>No options found</span>
          </CommandEmpty>

          {options.map((opt) => (
            <CommandItem
              key={opt.id}
              onSelect={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              {opt.children}
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandSelect;
