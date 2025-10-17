"use client";

import React, { useMemo, useState } from "react";
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
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

/**
 * ComboboxCreate
 *
 * Props:
 * - value: string
 * - onChange: (value: string) => void
 * - items: Array<{ value: string, label: string }>
 * - placeholder?: string
 * - emptyCreatePrefix?: string  // texto del botón "Crear ..."
 * - onCreate?: (name: string) => Promise<{ value: string, label: string }>
 * - disabled?: boolean
 * - className?: string
 */
export default function ComboboxCreate({
  value,
  onChange,
  items,
  placeholder = "Selecciona…",
  emptyCreatePrefix = "Crear",
  onCreate, // si viene, habilita crear inline
  disabled,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedLabel = items.find((i) => i.value === value)?.label || "";

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
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between w-full", className)}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)]">
        <Command>
          <CommandInput
            placeholder="Buscar…"
            className="h-9"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>

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
              <div className="p-1 border-t">
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
