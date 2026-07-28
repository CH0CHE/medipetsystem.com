"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import type { SupplierListResult } from "@/modules/purchases/domain/entities";

interface SupplierComboboxProps {
  value: string | null;
  onChange: (supplierId: string, supplierName: string) => void;
  error?: string;
}

/** Buscador simple de proveedores (sin cmdk) para asociar una orden de compra. */
export function SupplierCombobox({ value, onChange, error }: SupplierComboboxProps) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["suppliers-combobox", debouncedQuery],
    queryFn: () =>
      apiRequest<SupplierListResult>(`/api/purchases/suppliers?search=${encodeURIComponent(debouncedQuery)}&pageSize=8`),
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
          placeholder="Buscar proveedor por nombre o NIT..."
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
          {data?.items.map((supplier) => (
            <button
              key={supplier.supplierId}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(supplier.supplierId, supplier.name);
                setSelectedLabel(supplier.name);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="font-medium text-foreground">{supplier.name}</span>
              {supplier.taxId && <span className="ml-2 text-muted-foreground">{supplier.taxId}</span>}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
