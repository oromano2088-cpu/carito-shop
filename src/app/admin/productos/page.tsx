"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";

export default function AdminProductos() {
  const { products, updateProduct } = useApp();
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) => p.titulo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Productos ({products.length})</h1>
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
      <div className="flex flex-col gap-2.5">
        {filtered.map((p) => {
          const stockBajo = p.stock > 0 && p.stock <= p.stockMinimo;
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
                  {p.status === "agotado" && <Badge tone="danger">Sin stock</Badge>}
                  {stockBajo && <Badge tone="warn">Stock bajo: {p.stock}</Badge>}
                  {!stockBajo && p.status === "activo" && <Badge tone="success">Stock: {p.stock}</Badge>}
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
