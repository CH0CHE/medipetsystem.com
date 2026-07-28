"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ProductListResult } from "@/modules/inventory/domain/entities";

interface ProductComboboxProps {
  onChange: (product: { productId: string; name: string; salePrice: number }) => void;
  placeholder?: string;
}

/** Buscador simple de productos (sin cmdk) para agregar líneas a una cotización/factura. */
export function ProductCombobox({ onChange, placeholder }: ProductComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["products-combobox", debouncedQuery],
    queryFn: () => apiRequest<ProductListResult>(`/api/inventory/products?search=${encodeURIComponent(debouncedQuery)}&pageSize=8`),
    enabled: open && debouncedQuery.length > 0,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Buscar producto por nombre o SKU..."}
          className={cn("pl-9")}
          autoComplete="off"
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {data?.items.length === 0 && !isFetching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</p>
          )}
          {data?.items.map((product) => (
            <button
              key={product.productId}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange({ productId: product.productId, name: product.name, salePrice: product.salePrice });
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="font-medium text-foreground">{product.name}</span>
              <span className="ml-2 text-muted-foreground">{product.sku} · existencia {product.totalStock}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
