"use client";

import { useWhatsapp } from "@/lib/whatsapp";
import { waLink } from "@/lib/utils";
import { GOOGLE_MAPS_URL, MEDIOS_DE_PAGO } from "@/lib/site";

// Bloque de confianza al pie de la portada: WhatsApp, ubicación y reseñas en Google.
export function StoreInfo() {
  const whatsapp = useWhatsapp();
  const local = whatsapp.startsWith("549") ? whatsapp.slice(3) : whatsapp;
  const visible = local.length === 10 ? `${local.slice(0, 2)} ${local.slice(2, 6)}-${local.slice(6)}` : local;
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
      <p className="font-bold">¿Tenés dudas? Estamos para ayudarte</p>
      <a
        href={waLink(whatsapp, "Hola CARITO.SHOP! Quiero hacer una consulta")}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl px-4 py-3 text-sm font-semibold text-white text-center"
        style={{ background: "#25D366" }}
      >
        Escribinos por WhatsApp · {visible}
      </a>
      <ul className="text-sm text-muted flex flex-col gap-1">
        <li>💳 Pagás con {MEDIOS_DE_PAGO.join(", ").replace(/, ([^,]*)$/, " o $1")}.</li>
        <li>📦 Coordinamos la entrega o el retiro por WhatsApp.</li>
        <li>✅ Te respondemos las dudas antes de comprar.</li>
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-center bg-surface-2 border border-border">
          📍 Ver en Google Maps
        </a>
        <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-center bg-surface-2 border border-border">
          ⭐ Dejanos tu reseña
        </a>
      </div>
    </section>
  );
}
