"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"; // Import Loader2 for spinner

import { cn } from "@/shared/lib/utils"; // Adjust path as needed
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

// Define the structure for options
interface ComboboxOption {
  value: string;
  label: string;
  // You can add more properties here if needed, like disabled, etc.
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  inputPlaceholder?: string;
  allowCustomValue?: boolean;
  isLoading?: boolean; // Add isLoading prop
  className?: string;
  popoverContentClassName?: string;
  inputClassName?: string;
  listClassName?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  emptyMessage = "No options found.",
  inputPlaceholder = "Search options...",
  allowCustomValue = false,
  isLoading = false, // Default isLoading to false
  className,
  popoverContentClassName,
  inputClassName,
  listClassName,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value || ""); // Initialize search with current value

  // Find the label for the current value, or use the value itself if it's custom or not found
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption
    ? selectedOption.label
    : value || placeholder;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearch(selectedValue); // Update search input to reflect selection
    setOpen(false);
  };

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (isLoading) return []; // Don't show options while loading
    const lowerSearch = search.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    );
  }, [search, options, isLoading]);

  // Check if the current search value represents a potential custom value
  const isPotentialCustomValue =
    !isLoading && // Don't show custom value option while loading
    allowCustomValue &&
    search &&
    !options.some((opt) => opt.value === search);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn(
            "justify-between w-full font-normal text-left",
            !value && "text-muted-foreground", // Style like default input when empty
            className
          )}
          disabled={isLoading} // Disable the button while loading
        >
          {value ? selectedOption?.label || value : placeholder}
          {isLoading ? (
            <Loader2 className="ml-2 w-4 h-4 animate-spin shrink-0" />
          ) : (
            <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 w-[var(--radix-popover-trigger-width)]",
          popoverContentClassName
        )}
        align="start" // Align dropdown to the start of the trigger
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={inputPlaceholder}
            value={search}
            onValueChange={setSearch} // Update internal search state
            className={cn("h-9", inputClassName)}
            disabled={isLoading} // Disable input while loading
          />
          <CommandList
            className={cn("max-h-[200px] overflow-y-auto", listClassName)}
          >
            {isLoading ? (
              <div className="p-2 text-muted-foreground text-sm text-center">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 w-4 h-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Add Custom Value Item */}
                {isPotentialCustomValue && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value={search} // Use the search term as the value
                        onSelect={() => handleSelect(search)} // Select the custom value
                        className="text-muted-foreground italic cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 w-4 h-4",
                            value === search ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Add "{search}"
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
