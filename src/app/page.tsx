"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store-context";
import { useCategorias } from "@/lib/categorias";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { StoreInfo } from "@/components/StoreInfo";
import { AppPromo } from "@/components/AppPromo";

export default function HomePage() {
  const { products } = useApp();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const { categorias: todasCategorias } = useCategorias();
  // En la tienda solo se muestran las categorías que tienen productos visibles.
  const categoriasConProductos = useMemo(() => {
    const usadas = new Set(products.filter((p) => p.status !== "pausado").map((p) => p.categoria));
    const ordenadas = todasCategorias.filter((c) => usadas.has(c));
    const extra = [...usadas].filter((c) => c && !todasCategorias.includes(c));
    return [...ordenadas, ...extra];
  }, [products, todasCategorias]);

  const filtered = useMemo(() => {
    return products.filter((p) => p.status !== "pausado").filter((p) => {
      const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoria || p.categoria === categoria;
      return matchSearch && matchCat;
    });
  }, [products, search, categoria]);

  // Ofertas por tiempo limitado: descuento especial CON fecha de fin (las vencidas ya no llegan acá).
  const enOferta = filtered
    .filter((p) => p.precioOferta && p.ofertaHasta)
    .sort((a, b) => new Date(a.ofertaHasta!).getTime() - new Date(b.ofertaHasta!).getTime());

  // Novedades: los últimos 10 productos ingresados o modificados.
  const novedades = [...filtered]
    .sort((a, b) => new Date(b.actualizadoEn || b.creadoEn).getTime() - new Date(a.actualizadoEn || a.creadoEn).getTime())
    .slice(0, 10);

  return (
    <main className="flex-1 pb-24">
      <StoreHeader
        search={search}
        onSearch={setSearch}
        categorias={categoriasConProductos}
        categoriaActiva={categoria}
        onCategoria={(c) => {
          setCategoria(c);
          // Al elegir una categoría, la lista arranca desde el primer producto.
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <div className="mx-auto max-w-lg px-4 py-4 flex flex-col gap-6">
        {!search && !categoria && <AppPromo />}
        {novedades.length > 0 && !search && !categoria && (
          <div>
            <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">🆕 Novedades</h2>
            <div className="-mx-4 px-[7.5%] flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory scroll-smooth">
              {novedades.map((p) => (
                <div key={p.id} className="w-[85%] shrink-0 snap-center snap-always">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {enOferta.length > 0 && !search && !categoria && (
          <div>
            <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">⚡ Ofertas por tiempo limitado</h2>
            <div className="-mx-4 px-[7.5%] flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory scroll-smooth">
              {enOferta.map((p) => (
                <div key={p.id} className="w-[85%] shrink-0 snap-center snap-always">
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

        <StoreInfo />
      </div>
      <BottomNav />
    </main>
  );
}
