"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink, productImages } from "@/lib/utils";
import { Badge, CountdownChip, IconButton, Button } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import { ImageCarousel } from "@/components/ImageCarousel";

export default function FeedPage() {
  const { products, toggleLike, toggleSave, isLiked, isSaved, addToCart, registerShare, registerView } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [popId, setPopId] = useState<string | null>(null);

  useEffect(() => {
    if (products[0]) registerView(products[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    const p = products[idx];
    if (p) registerView(p.id);
  };

  const share = (id: string, titulo: string, precio: number) => {
    registerShare(id);
    const url = typeof window !== "undefined" ? `${window.location.origin}/producto/${id}` : "";
    window.open(waLink("", `¡Mirá esto! ${titulo} a ${formatMoney(precio)} 🔥\n${url}`), "_blank");
  };

  return (
    <main className="flex-1 relative">
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <span className="font-extrabold text-white tracking-tight">
          CARITO<span className="neon-text">.SHOP</span> · Feed
        </span>
        <Link href="/" className="text-white text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
          Ver catálogo
        </Link>
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-[100dvh] overflow-y-scroll snap-y-mandatory no-scrollbar pb-16"
      >
        {products.map((p) => {
          const liked = isLiked(p.id);
          const saved = isSaved(p.id);
          const precioFinal = p.precioOferta ?? p.precio;
          const agotado = p.status === "agotado" || p.stock === 0;
          return (
            <section key={p.id} className="relative h-[100dvh] w-full snap-start flex items-end">
              <div
                className="absolute inset-0"
                onDoubleClick={() => {
                  if (!liked) toggleLike(p.id);
                  setPopId(p.id);
                  setTimeout(() => setPopId(null), 700);
                }}
              >
                <ImageCarousel images={productImages(p)} alt={p.titulo} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />
              </div>

              {popId === p.id && (
                <span className="heart-pop absolute inset-0 flex items-center justify-center text-8xl pointer-events-none">❤️</span>
              )}

              <div className="absolute right-3 bottom-28 flex flex-col gap-4 items-center z-20">
                <div className="flex flex-col items-center gap-1">
                  <IconButton label="Me gusta" active={liked} onClick={() => toggleLike(p.id)}>
                    {liked ? "❤️" : "🤍"}
                  </IconButton>
                  <span className="text-white text-xs font-semibold">{p.likes}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton label="Guardar" active={saved} onClick={() => toggleSave(p.id)}>
                    {saved ? "🔖" : "📑"}
                  </IconButton>
                  <span className="text-white text-xs font-semibold">{p.guardados}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton label="Compartir por WhatsApp" onClick={() => share(p.id, p.titulo, precioFinal)}>
                    ↗️
                  </IconButton>
                  <span className="text-white text-xs font-semibold">{p.compartidos}</span>
                </div>
              </div>

              <div className="relative z-20 w-full px-4 pb-6 flex flex-col gap-2 text-white">
                <div className="flex gap-2">
                  <Badge tone="accent">{p.categoria}</Badge>
                  {p.precioOferta && <Badge tone="danger">-{Math.round((1 - p.precioOferta / p.precio) * 100)}%</Badge>}
                </div>
                {p.ofertaHasta && <CountdownChip iso={p.ofertaHasta} />}
                <Link href={`/producto/${p.id}`} className="text-xl font-extrabold leading-snug">
                  {p.titulo}
                </Link>
                <p className="text-sm text-white/80 line-clamp-2">{p.descripcion}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold">{formatMoney(precioFinal)}</span>
                  {p.precioOferta && <span className="text-sm text-white/60 line-through">{formatMoney(p.precio)}</span>}
                </div>
                <Button disabled={agotado} className="w-full mt-1" onClick={() => addToCart(p.id, p.variantes?.[0]?.id)}>
                  {agotado ? "Sin stock" : "Agregar al carrito 🛒"}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
      <BottomNav />
    </main>
  );
}
