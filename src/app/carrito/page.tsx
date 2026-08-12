"use client";

import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney } from "@/lib/utils";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui";

export default function CarritoPage() {
  const { cart, products, setCartQty, removeFromCart, cartTotal } = useApp();

  return (
    <main className="flex-1 pb-32">
      <StoreHeader />
      <div className="mx-auto max-w-lg px-4 py-4">
        <h1 className="text-lg font-extrabold mb-4">Tu carrito</h1>

        {cart.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted text-sm mb-4">Todavía no agregaste productos.</p>
            <Link href="/">
              <Button>Ir a comprar</Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {cart.map((line) => {
            const p = products.find((pp) => pp.id === line.productId);
            if (!p) return null;
            const variante = p.variantes?.find((v) => v.id === line.varianteId);
            const precio = (p.precioOferta ?? p.precio) + (variante?.precioExtra ?? 0);
            return (
              <div key={`${line.productId}-${line.varianteId}`} className="flex gap-3 bg-surface border border-border rounded-2xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagen} alt={p.titulo} className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-semibold text-sm leading-snug">{p.titulo}</span>
                  {variante && <span className="text-xs text-muted">{variante.nombre}</span>}
                  <span className="font-bold text-sm">{formatMoney(precio)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setCartQty(p.id, line.varianteId, line.cantidad - 1)}
                      className="h-7 w-7 rounded-full bg-surface-2 border border-border text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{line.cantidad}</span>
                    <button
                      onClick={() => setCartQty(p.id, line.varianteId, line.cantidad + 1)}
                      className="h-7 w-7 rounded-full bg-surface-2 border border-border text-sm"
                    >
                      +
                    </button>
                    <button onClick={() => removeFromCart(p.id, line.varianteId)} className="ml-auto text-xs text-danger font-semibold">
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-30 bg-surface border-t border-border px-4 py-3">
          <div className="mx-auto max-w-lg flex items-center justify-between mb-3">
            <span className="text-sm text-muted">Total</span>
            <span className="text-xl font-extrabold">{formatMoney(cartTotal)}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full">Continuar compra →</Button>
          </Link>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
