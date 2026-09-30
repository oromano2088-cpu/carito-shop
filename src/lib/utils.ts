import { Product } from "./types";

/** Devuelve la lista de fotos de un producto (hasta 5), con la foto de portada
 * (`imagen`) siempre primero, sea cual sea el estado de `imagenes`. */
export function productImages(p: Pick<Product, "imagen" | "imagenes">): string[] {
  const extra = (p.imagenes ?? []).filter((url) => url && url !== p.imagen);
  return [p.imagen, ...extra].filter(Boolean);
}

export function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function waLink(phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/** Abre el menú nativo de compartir del celular (WhatsApp, Instagram, copiar link...).
 *  Si el navegador no lo soporta, abre WhatsApp directamente. */
export async function shareProduct(titulo: string, precio: string, url: string) {
  const text = `¡Mirá esto! ${titulo} a ${precio} 🔥`;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: titulo, text, url });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // el cliente cerró el menú
    }
  }
  window.open(waLink("", `${text}\n${url}`), "_blank");
}

export function timeLeft(iso?: string) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, diff };
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (24 * 3600 * 1000));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}
