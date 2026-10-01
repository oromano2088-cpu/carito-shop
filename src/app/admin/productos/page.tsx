"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";

export default function AdminProductos() {
  const { products, updateProduct } = useApp();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "sin_stock" | "stock_bajo" | "pausados">("todos");

  const sinStock = (p: (typeof products)[number]) => p.status !== "pausado" && (p.stock === 0 || p.status === "agotado");
  const bajo = (p: (typeof products)[number]) => p.status !== "pausado" && p.stock > 0 && p.stock <= p.stockMinimo;

  const categorias = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p) => m.set(p.categoria, (m.get(p.categoria) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const enCategoria = products.filter((p) => !categoria || p.categoria === categoria);
  const cuenta = {
    todos: enCategoria.length,
    sin_stock: enCategoria.filter(sinStock).length,
    stock_bajo: enCategoria.filter(bajo).length,
    pausados: enCategoria.filter((p) => p.status === "pausado").length,
  };
  const filtered = enCategoria
    .filter((p) => p.titulo.toLowerCase().includes(search.toLowerCase()))
    .filter((p) =>
      filtro === "sin_stock" ? sinStock(p) : filtro === "stock_bajo" ? bajo(p) : filtro === "pausados" ? p.status === "pausado" : true
    );

  const chip = (activo: boolean) =>
    `whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
      activo ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
    }`;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Productos</h1>
        <Link href="/admin/productos/nuevo">
          <Button className="!px-3 !py-2 text-xs">+ Cargar con foto 📸</Button>
        </Link>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <button onClick={() => setCategoria("")} className={chip(!categoria)}>Todas ({products.length})</button>
        {categorias.map(([c, n]) => (
          <button key={c} onClick={() => setCategoria(c)} className={chip(categoria === c)}>
            {c} ({n})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([
          ["todos", "Todos", "text-foreground"],
          ["sin_stock", "Sin stock", "text-danger"],
          ["stock_bajo", "Stock bajo", "text-warn"],
          ["pausados", "Pausados", "text-muted"],
        ] as const).map(([k, label, color]) => (
          <button
            key={k}
            onClick={() => setFiltro(k)}
            className={`rounded-xl border p-2 text-center ${filtro === k ? "border-accent bg-accent/10" : "border-border bg-surface"}`}
          >
            <p className={`text-lg font-extrabold leading-none ${color}`}>{cuenta[k]}</p>
            <p className="text-[10px] text-muted mt-1">{label}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && <p className="text-sm text-muted text-center py-6">No hay productos con este filtro.</p>}
        {filtered.map((p) => {
          const stockBajo = bajo(p);
          const agotado = sinStock(p);
          return (
            <div key={p.id} className="flex gap-3 bg-surface border border-border rounded-2xl p-3">
              <Link href={`/admin/productos/${p.id}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagen} alt={p.titulo} className="h-16 w-16 rounded-xl object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/admin/productos/${p.id}`} className="text-sm font-semibold truncate block">
                  {p.titulo}
                </Link>
                <p className="text-xs text-muted">{p.categoria} · {formatMoney(p.precioOferta ?? p.precio)}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {agotado && <Badge tone="danger">Sin stock</Badge>}
                  {stockBajo && <Badge tone="warn">Stock bajo: {p.stock}</Badge>}
                  {!stockBajo && !agotado && p.status !== "pausado" && <Badge tone="success">Stock: {p.stock}</Badge>}
                  {p.status === "pausado" && <Badge>Pausado</Badge>}
                  {p.imagenes && p.imagenes.length > 1 && <Badge tone="accent">{p.imagenes.length} fotos</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                    className="h-7 w-7 rounded-full bg-surface-2 border border-border text-sm"
                  >
                    −
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{p.stock}</span>
                  <button
                    onClick={() => updateProduct(p.id, { stock: p.stock + 1, status: p.status === "agotado" ? "activo" : p.status })}
                    className="h-7 w-7 rounded-full bg-surface-2 border border-border text-sm"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => updateProduct(p.id, { status: p.status === "activo" ? "pausado" : "activo" })}
                  className="text-[11px] font-semibold text-muted"
                >
                  {p.status === "activo" ? "Pausar" : "Activar"}
                </button>
                <Link href={`/admin/productos/${p.id}`} className="text-[11px] font-bold text-accent">
                  Editar →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
