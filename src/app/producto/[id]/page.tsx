"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink, productImages, shareProduct } from "@/lib/utils";
import { Badge, OfertaBanner, IconButton, Button, ShareIcon, BookmarkIcon } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useWhatsapp } from "@/lib/whatsapp";
import { ConsultaStockOverlay } from "@/components/ConsultaStock";

export default function ProductoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const whatsapp = useWhatsapp();
  const { id } = use(params);
  const { products, toggleLike, toggleSave, isLiked, isSaved, addToCart, registerShare, registerView } = useApp();
  const product = products.find((p) => p.id === id);
  const [varianteId, setVarianteId] = useState(product?.variantes?.[0]?.id);

  useEffect(() => {
    if (product) registerView(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!product) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted">Producto no encontrado.</p>
      </main>
    );
  }

  const liked = isLiked(product.id);
  const saved = isSaved(product.id);
  const agotado = product.status === "agotado" || product.stock === 0;
  const precioFinal = (product.precioOferta ?? product.precio) + (product.variantes?.find((v) => v.id === varianteId)?.precioExtra ?? 0);

  const share = () => {
    registerShare(product.id);
    const url = typeof window !== "undefined" ? window.location.href : "";
    shareProduct(product.titulo, formatMoney(precioFinal), url, product.precioOferta ? { antes: formatMoney(product.precio), hasta: product.ofertaHasta } : undefined);
  };

  return (
    <main className="flex-1 pb-40">
      <div className="relative w-full h-[40vh] max-h-[440px] bg-surface-2">
        <ImageCarousel images={productImages(product)} alt={product.titulo} fit="contain" />
        {agotado && <ConsultaStockOverlay titulo={product.titulo} />}
        <Link href="/" className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white z-10">
          ←
        </Link>
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <IconButton label="Me gusta" active={liked} onClick={() => toggleLike(product.id)}>
            {liked ? "❤️" : "🤍"}
          </IconButton>
          <IconButton label={saved ? "Guardado" : "Guardar para después"} active={saved} onClick={() => toggleSave(product.id)}>
            <BookmarkIcon filled={saved} />
          </IconButton>
          <IconButton label="Compartir" onClick={share}>
            <ShareIcon />
          </IconButton>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-3 pb-5 flex flex-col gap-2.5">
        <div className="flex gap-2">
          <Badge tone="accent">{product.categoria}</Badge>
          {product.garantiaMeses > 0 && <Badge>{product.garantiaMeses} meses de garantía</Badge>}
        </div>
        <h1 className="text-lg font-extrabold leading-snug">{product.titulo}</h1>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold">{formatMoney(precioFinal)}</span>
          {product.precioOferta && <span className="text-muted line-through">{formatMoney(product.precio)}</span>}
          {product.precioOferta && product.precio > product.precioOferta && (
            <span className="text-sm font-bold text-accent-2">-{Math.round((1 - product.precioOferta / product.precio) * 100)}%</span>
          )}
        </div>

        {product.precioOferta && product.ofertaHasta && !agotado && (
          <OfertaBanner iso={product.ofertaHasta} ahorro={product.precio > product.precioOferta ? `Ahorrás ${formatMoney(product.precio - product.precioOferta)}` : undefined} />
        )}

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>❤️ {product.likes}</span>
          <span>🔖 {product.guardados}</span>
          <span>{product.vendidos} vendidos</span>
          <span className="ml-auto">SKU {product.sku}</span>
        </div>

        {product.variantes && (
          <div>
            <p className="text-sm font-semibold mb-2">Elegí una opción</p>
            <div className="flex gap-2 flex-wrap">
              {product.variantes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVarianteId(v.id)}
                  className={`text-sm font-semibold px-3 py-2 rounded-xl border ${
                    varianteId === v.id ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
                  }`}
                >
                  {v.nombre} {v.stock <= 3 && v.stock > 0 && <span className="opacity-70">· últimas {v.stock}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-1">Descripción</p>
          <p className="text-sm text-muted leading-relaxed">{product.descripcion}</p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Características</p>
          <ul className="grid grid-cols-1 gap-1.5">
            {product.caracteristicas.map((c) => (
              <li key={c} className="text-sm text-muted flex items-center gap-2">
                <span className="text-accent-2">✓</span> {c}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={waLink(whatsapp, `Hola CARITO.SHOP! Me interesa ${product.titulo} (${formatMoney(precioFinal)}). ¿Está disponible? ${typeof window !== "undefined" ? window.location.href : ""}`)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl px-4 py-3 text-sm font-semibold text-white text-center"
          style={{ background: "#25D366" }}
        >
          💬 Consultar este producto por WhatsApp
        </a>
      </div>

      <div className="fixed bottom-16 inset-x-0 z-30 bg-surface border-t border-border px-4 py-3">
        <div className="mx-auto max-w-lg flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={agotado} onClick={() => addToCart(product.id, varianteId)}>
            Agregar 🛒
          </Button>
          <Link href="/checkout" className="flex-1">
            <Button
              className="w-full"
              disabled={agotado}
              onClick={() => addToCart(product.id, varianteId)}
            >
              Comprar ahora
            </Button>
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
