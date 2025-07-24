"use client";

import * as React from "react";
import { type DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { xor } from "lodash";
import { Button } from "./button";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export function SimpleMultiSelect({
  fields,
  setFields,
  options,
}: {
  fields: string[];
  setFields: (fields: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={(open) => setOpen(open)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex justify-start items-center w-full"
        >
          {fields?.join(", ")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[ --radix-dropdown-menu-trigger-available-height]">
        {options?.map((o, i) => (
          <DropdownMenuCheckboxItem
            key={i}
            checked={fields?.includes(o)}
            onCheckedChange={(checked) => setFields(xor([o], fields))}
            onSelect={(e) => e.preventDefault()}
          >
            {o}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
