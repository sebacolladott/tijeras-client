"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus, X } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const selected = items.find((i) => i.value === value);

  // sincroniza el input con el valor seleccionado
  useEffect(() => {
    if (selected) setQuery(selected.label);
    else setQuery("");
  }, [selected]);

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
      setEditing(false);
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setEditing(true);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <Command>
          <CommandInput
            placeholder={placeholder}
            disabled={disabled}
            value={query}
            onFocus={() => setEditing(true)}
            onValueChange={setQuery}
            className="pr-8 h-9"
          />

          {selected && !editing && (
            <button
              type="button"
              onClick={handleClear}
              className="top-1/2 right-2 absolute opacity-60 hover:opacity-100 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {editing && (
            <CommandList className="mt-1 border rounded-md max-h-52 overflow-y-auto">
              <CommandEmpty>Sin resultados</CommandEmpty>

              <CommandGroup>
                {filtered.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => {
                      onChange(item.value);
                      setEditing(false);
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
          )}
        </Command>
      </div>
    </div>
  );
}
