"use client";

import { useState } from "react";
import { useApp } from "@/lib/store-context";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";

export default function GuardadosPage() {
  const { products, engagement } = useApp();
  const [tab, setTab] = useState<"guardados" | "likes">("guardados");
  const guardadosIds = engagement.filter((e) => e.saved).map((e) => e.productId);
  const likesIds = engagement.filter((e) => e.liked).map((e) => e.productId);
  const ids = tab === "guardados" ? guardadosIds : likesIds;
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <main className="flex-1 pb-24">
      <StoreHeader />
      <div className="mx-auto max-w-lg px-4 py-4">
        <h1 className="text-lg font-extrabold mb-1">Tus productos</h1>
        <p className="text-sm text-muted mb-4">Todo lo que guardaste o te gustó, en un solo lugar. Cuando quieras, completá la compra.</p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("guardados")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border ${tab === "guardados" ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"}`}
          >
            🔖 Guardados ({guardadosIds.length})
          </button>
          <button
            onClick={() => setTab("likes")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border ${tab === "likes" ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"}`}
          >
            ❤️ Me gusta ({likesIds.length})
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted py-16 text-sm">
              Todavía no {tab === "guardados" ? "guardaste" : "le diste like a"} ningún producto. Explorá el catálogo o el feed 🔥
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
