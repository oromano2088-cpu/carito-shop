"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store-context";
import { CATEGORIAS } from "@/lib/seed-data";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";

export default function HomePage() {
  const { products } = useApp();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoria || p.categoria === categoria;
      return matchSearch && matchCat;
    });
  }, [products, search, categoria]);

  const enOferta = filtered.filter((p) => p.precioOferta);

  return (
    <main className="flex-1 pb-24">
      <StoreHeader
        search={search}
        onSearch={setSearch}
        categorias={CATEGORIAS}
        categoriaActiva={categoria}
        onCategoria={setCategoria}
      />
      <div className="mx-auto max-w-lg px-4 py-4 flex flex-col gap-6">
        {enOferta.length > 0 && !search && !categoria && (
          <div className="-mx-4 px-4">
            <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">⚡ Ofertas por tiempo limitado</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {enOferta.map((p) => (
                <div key={p.id} className="min-w-[78%]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">
            {categoria || "Todos los productos"} · {filtered.length}
          </h2>
          <div className="flex flex-col gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted py-10 text-sm">No encontramos productos con esa búsqueda.</p>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
