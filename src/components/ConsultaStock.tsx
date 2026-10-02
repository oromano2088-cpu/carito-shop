"use client";

import { useWhatsapp } from "@/lib/whatsapp";
import { waLink } from "@/lib/utils";

function mensaje(titulo: string) {
  return `Hola CARITO.SHOP! ¿Tienen stock de ${titulo}?`;
}

/** Cartel semitransparente sobre la foto de un producto sin stock: abre WhatsApp para consultar. */
export function ConsultaStockOverlay({ titulo }: { titulo: string }) {
  const whatsapp = useWhatsapp();
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <a
        href={waLink(whatsapp, mensaje(titulo))}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto flex flex-col items-center gap-0.5 rounded-2xl bg-black/55 backdrop-blur-sm border border-white/25 px-6 py-3 text-white shadow-lg"
      >
        <span className="text-base font-extrabold">💬 Consultar stock</span>
      </a>
    </div>
  );
}

/** Botón verde que reemplaza a "Agregar al carrito" cuando no hay stock. */
export function ConsultaStockButton({ titulo, className = "" }: { titulo: string; className?: string }) {
  const whatsapp = useWhatsapp();
  return (
    <a
      href={waLink(whatsapp, mensaje(titulo))}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white ${className}`}
      style={{ background: "#25D366" }}
    >
      💬 Consultar stock
    </a>
  );
}
