"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink, productImages, shareProduct, cn } from "@/lib/utils";
import { Badge, IconButton, Button, ShareIcon, BookmarkIcon } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useWhatsapp } from "@/lib/whatsapp";
import { AyudaButton } from "@/components/Guia";

const pad = (n: number) => n.toString().padStart(2, "0");

/** Contador grande de la oferta. Usa el "ahora" de la página para que todo se actualice junto. */
function ContadorOferta({ hasta, now }: { hasta?: string; now: number }) {
  if (!hasta) {
    return (
      <span className="inline-flex items-center gap-1.5 self-start text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 backdrop-blur">
        🔥 Oferta especial
      </span>
    );
  }
  const diff = Math.max(0, new Date(hasta).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const urgente = diff < 3600000; // menos de 1 hora
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-white font-bold shadow-lg",
        urgente ? "bg-danger animate-pulse" : "bg-danger/90"
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span className="text-xs uppercase tracking-wide opacity-90">{urgente ? "¡Última hora!" : "Termina en"}</span>
      <span className="text-base">
        {d > 0 && `${d}d `}
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </span>
  );
}

export default function OfertasPage() {
  const { products: allProducts, toggleLike, toggleSave, isLiked, isSaved, addToCart, registerShare, registerView } = useApp();
  const whatsapp = useWhatsapp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [popId, setPopId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Reloj de la página: cada segundo actualiza los contadores y saca las ofertas vencidas.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Solo ofertas vigentes y con stock. Primero las que vencen antes; las que no tienen fecha, al final.
  const products = useMemo(
    () =>
      allProducts
        .filter((p) => p.status !== "pausado" && p.status !== "agotado" && p.stock > 0)
        .filter((p) => p.precioOferta && (!p.ofertaHasta || new Date(p.ofertaHasta).getTime() > now))
        .sort((a, b) => {
          const ta = a.ofertaHasta ? new Date(a.ofertaHasta).getTime() : Infinity;
          const tb = b.ofertaHasta ? new Date(b.ofertaHasta).getTime() : Infinity;
          return ta - tb;
        }),
    [allProducts, now]
  );

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
    shareProduct(titulo, formatMoney(precio), url);
  };

  return (
    <main className="flex-1 relative">
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <span className="font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>
            CARITO<span className="neon-text">.SHOP</span> · OFERTAS
          </span>
          {products.length > 0 && (
            <span className="text-[11px] font-bold bg-danger text-white rounded-full px-2 py-0.5">{products.length}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <AyudaButton dark />
          <Link href="/" className="text-white text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
            Ver catálogo
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center bg-black text-white pb-16">
          <span className="text-6xl">🔥</span>
          <h1 className="text-2xl font-extrabold text-balance">No hay ofertas activas en este momento</h1>
          <p className="text-white/70 text-sm max-w-xs">Las ofertas duran poco: volvé pronto o escribinos y te avisamos cuando salga la próxima.</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Link href="/" className="w-full text-center font-bold rounded-full py-3 bg-white text-black">
              Ver catálogo
            </Link>
            <a
              href={waLink(whatsapp, "Hola CARITO.SHOP! Avisame cuando haya ofertas nuevas 🙌")}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center font-bold rounded-full py-3 text-white"
              style={{ background: "#25D366" }}
            >
              Avisame por WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="h-[100dvh] overflow-y-scroll snap-y-mandatory no-scrollbar pb-16"
        >
          {products.map((p) => {
            const liked = isLiked(p.id);
            const saved = isSaved(p.id);
            const precioFinal = p.precioOferta ?? p.precio;
            const descuento = p.precioOferta ? Math.round((1 - p.precioOferta / p.precio) * 100) : 0;
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
                  <ImageCarousel images={productImages(p)} alt={p.titulo} fit="contain" padClass="pt-14 pb-[18rem]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />
                </div>

                {popId === p.id && (
                  <span className="heart-pop absolute inset-0 flex items-center justify-center text-8xl pointer-events-none">❤️</span>
                )}

                <div className="absolute right-3 top-20 flex flex-col gap-4 items-center z-20">
                  <div className="flex flex-col items-center gap-1">
                    <IconButton label="Me gusta" active={liked} onClick={() => toggleLike(p.id)}>
                      {liked ? "❤️" : "🤍"}
                    </IconButton>
                    <span className="text-white text-xs font-semibold">{p.likes > 0 ? p.likes : "Me gusta"}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <IconButton label={saved ? "Guardado" : "Guardar para después"} active={saved} onClick={() => toggleSave(p.id)}>
                      <BookmarkIcon filled={saved} />
                    </IconButton>
                    <span className="text-white text-xs font-semibold">{saved ? "Guardado" : "Guardar"}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <a
                      href={waLink(whatsapp, `Hola CARITO.SHOP! Me interesa la oferta de ${p.titulo} (${formatMoney(precioFinal)}). ¿Está disponible?`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Consultar por WhatsApp"
                      className="h-11 w-11 rounded-full flex items-center justify-center text-lg shadow"
                      style={{ background: "#25D366" }}
                    >
                      💬
                    </a>
                    <span className="text-white text-xs font-semibold">Consultar</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <IconButton label="Compartir" onClick={() => share(p.id, p.titulo, precioFinal)}>
                      <ShareIcon />
                    </IconButton>
                    <span className="text-white text-xs font-semibold">Compartir</span>
                  </div>
                </div>

                <div className="relative z-20 w-full px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col gap-2 text-white">
                  <ContadorOferta hasta={p.ofertaHasta} now={now} />
                  <div className="flex gap-2">
                    <Badge tone="accent">{p.categoria}</Badge>
                    {descuento > 0 && <Badge tone="danger">-{descuento}%</Badge>}
                  </div>
                  <Link href={`/producto/${p.id}`} className="text-xl font-extrabold leading-snug">
                    {p.titulo}
                  </Link>
                  <p className="text-sm text-white/80 line-clamp-2">{p.descripcion}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold">{formatMoney(precioFinal)}</span>
                    <span className="text-sm text-white/60 line-through">{formatMoney(p.precio)}</span>
                  </div>
                  <Button className="w-full mt-1" onClick={() => addToCart(p.id, p.variantes?.[0]?.id)}>
                    Agregar al carrito 🛒
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
