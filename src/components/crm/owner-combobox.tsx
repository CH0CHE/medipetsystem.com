"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import type { OwnerListResult } from "@/modules/owners/domain/entities";

interface OwnerComboboxProps {
  value: string | null;
  onChange: (ownerId: string, ownerName: string) => void;
  error?: string;
}

/** Buscador simple de propietarios (sin dependencia de cmdk) para asociar una mascota. */
export function OwnerCombobox({ value, onChange, error }: OwnerComboboxProps) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["owners-combobox", debouncedQuery],
    queryFn: () =>
      apiRequest<OwnerListResult>(`/api/crm/owners?search=${encodeURIComponent(debouncedQuery)}&pageSize=8`),
    enabled: open && debouncedQuery.length > 0,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value ? selectedLabel : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar propietario por nombre o documento..."
          className={cn("pl-9", error && "border-destructive")}
          autoComplete="off"
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {data?.items.length === 0 && !isFetching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          )}
          {data?.items.map((owner) => (
            <button
              key={owner.ownerId}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(owner.ownerId, owner.fullName);
                setSelectedLabel(owner.fullName);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="font-medium text-foreground">{owner.fullName}</span>
              {owner.documentId && <span className="ml-2 text-muted-foreground">{owner.documentId}</span>}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
