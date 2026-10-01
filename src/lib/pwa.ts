"use client";

// Instalación de la tienda como app (PWA) y botón "Compartir la app".
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let pendiente: InstallEvent | null = null;
const avisos = new Set<() => void>();
const avisar = () => avisos.forEach((fn) => fn());

/** Se llama una sola vez al abrir la tienda: guarda el permiso de instalación y registra el service worker. */
export function initPwa() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __caritoPwa?: boolean };
  if (w.__caritoPwa) return;
  w.__caritoPwa = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pendiente = e as InstallEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    pendiente = null;
    avisar();
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export function onPwaChange(fn: () => void) {
  avisos.add(fn);
  return () => {
    avisos.delete(fn);
  };
}

export const puedeInstalarDirecto = () => pendiente !== null;

/** Abre el cartel nativo de instalación. Devuelve false si el navegador no lo ofrece. */
export async function instalarApp() {
  if (!pendiente) return false;
  const ev = pendiente;
  pendiente = null;
  await ev.prompt();
  await ev.userChoice.catch(() => null);
  avisar();
  return true;
}

export function yaInstalada() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function esIPhone() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export async function compartirApp() {
  const url = window.location.origin;
  const text = "¡Mirá CARITO.SHOP! Tecnología, accesorios y hogar. Instalá la app en tu celular y enterate primero de las ofertas:";
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "CARITO.SHOP", text, url });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
}
