"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink, productImages } from "@/lib/utils";
import { Badge, CountdownChip, IconButton, Button } from "./ui";
import { ImageCarousel } from "./ImageCarousel";

export function ProductCard({ product }: { product: Product }) {
  const { toggleLike, toggleSave, isLiked, isSaved, addToCart, registerShare } = useApp();
  const [varianteId, setVarianteId] = useState(product.variantes?.[0]?.id);
  const [popHeart, setPopHeart] = useState(false);
  const liked = isLiked(product.id);
  const saved = isSaved(product.id);
  const stockBajo = product.stock > 0 && product.stock <= product.stockMinimo;
  const agotado = product.status === "agotado" || product.stock === 0;
  const precioFinal = (product.precioOferta ?? product.precio) + (product.variantes?.find((v) => v.id === varianteId)?.precioExtra ?? 0);
  const images = productImages(product);

  const share = () => {
    registerShare(product.id);
    const url = typeof window !== "undefined" ? `${window.location.origin}/producto/${product.id}` : "";
    window.open(waLink("", `¡Mirá esto! ${product.titulo} a ${formatMoney(precioFinal)} 🔥\n${url}`), "_blank");
  };

  return (
    <article className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div
        className="relative w-full aspect-square bg-surface-2"
        onDoubleClick={() => {
          if (!liked) toggleLike(product.id);
          setPopHeart(true);
          setTimeout(() => setPopHeart(false), 700);
        }}
      >
        {images.length > 1 ? (
          <ImageCarousel images={images} alt={product.titulo} />
        ) : (
          <Link href={`/producto/${product.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imagen} alt={product.titulo} className="w-full h-full object-cover" loading="lazy" />
          </Link>
        )}
        {popHeart && (
          <span className="heart-pop absolute inset-0 flex items-center justify-center text-7xl pointer-events-none">❤️</span>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.precioOferta && <Badge tone="danger">-{Math.round((1 - product.precioOferta / product.precio) * 100)}%</Badge>}
          {stockBajo && !agotado && <Badge tone="warn">Últimas {product.stock} unidades</Badge>}
          {agotado && <Badge tone="default">Sin stock</Badge>}
        </div>
        {product.ofertaHasta && !agotado && (
          <div className="absolute bottom-3 left-3">
            <CountdownChip iso={product.ofertaHasta} />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <IconButton label="Me gusta" active={liked} onClick={() => toggleLike(product.id)}>
            {liked ? "❤️" : "🤍"}
          </IconButton>
          <IconButton label="Guardar" active={saved} onClick={() => toggleSave(product.id)}>
            {saved ? "🔖" : "📑"}
          </IconButton>
          <IconButton label="Compartir por WhatsApp" onClick={share}>
            ↗️
          </IconButton>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span>❤️ {product.likes}</span>
          <span>🔖 {product.guardados}</span>
          <span>{product.vendidos} vendidos</span>
        </div>
        <Link href={`/producto/${product.id}`} className="font-bold leading-snug">
          {product.titulo}
        </Link>
        <p className="text-sm text-muted line-clamp-2">{product.descripcion}</p>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold">{formatMoney(precioFinal)}</span>
          {product.precioOferta && <span className="text-sm text-muted line-through">{formatMoney(product.precio)}</span>}
        </div>
        <span className="text-xs text-muted -mt-2">en 6 cuotas sin interés</span>

        {product.variantes && (
          <div className="flex gap-2 flex-wrap">
            {product.variantes.map((v) => (
              <button
                key={v.id}
                onClick={() => setVarianteId(v.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  varianteId === v.id ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
                }`}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        )}

        <Button
          disabled={agotado}
          className="w-full mt-1"
          onClick={() => addToCart(product.id, varianteId)}
        >
          {agotado ? "Sin stock" : "Agregar al carrito 🛒"}
        </Button>
      </div>
    </article>
  );
}
