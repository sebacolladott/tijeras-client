"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ComboboxCreate({
  value,
  onChange,
  items,
  placeholder = "Selecciona…",
  emptyCreatePrefix = "Crear",
  onCreate,
  disabled,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const selected = items.find((i) => i.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q && items.some((i) => i.label.toLowerCase() === q);
  }, [items, query]);

  const handleCreate = async () => {
    if (!onCreate) return;
    const name = query.trim();
    if (!name) return;
    try {
      setCreating(true);
      const created = await onCreate(name);
      onChange(created.value);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("justify-between w-full", className)}
        >
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o crear..."
            value={query}
            onValueChange={setQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>

            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto w-4 h-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            {onCreate && query.trim() && !exactMatch && (
              <div className="mt-1 p-1 border-t">
                <Button
                  variant="ghost"
                  className="justify-start w-full"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 w-4 h-4" />
                  )}
                  {emptyCreatePrefix} “{query.trim()}”
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
