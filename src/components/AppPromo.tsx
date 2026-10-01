"use client";

import { useEffect, useState } from "react";
import { compartirApp, esIPhone, initPwa, instalarApp, onPwaChange, yaInstalada } from "@/lib/pwa";
import { ShareIcon } from "./ui";

/** Registra el service worker y captura el permiso de instalación apenas abre la tienda. */
export function PwaInit() {
  useEffect(() => initPwa(), []);
  return null;
}

/** Franja "Instalá la app / Compartir la app" de la portada. */
export function AppPromo() {
  const [instalada, setInstalada] = useState(true); // arranca oculta hasta saberlo (evita parpadeo)
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    const actualizar = () => setInstalada(yaInstalada());
    actualizar();
    return onPwaChange(actualizar);
  }, []);

  const instalar = async () => {
    const ok = await instalarApp();
    if (!ok) setAyuda(true);
  };

  return (
    <>
      <section className="rounded-2xl border border-accent/30 bg-accent/10 p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{instalada ? "¿Te gusta CARITO.SHOP?" : "Llevá CARITO.SHOP en tu celular"}</p>
          <p className="text-xs text-muted leading-snug">
            {instalada ? "Compartila con tus amigos y familia." : "Entrás en un toque y ves las ofertas primero."}
          </p>
        </div>
        {!instalada && (
          <button onClick={instalar} className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold bg-accent text-white">
            📲 Instalar
          </button>
        )}
        <button
          onClick={compartirApp}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold bg-surface-2 border border-border flex items-center gap-1.5"
        >
          <ShareIcon className="h-4 w-4" /> Compartir
        </button>
      </section>

      {ayuda && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setAyuda(false)}>
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-extrabold">Instalá la app en 2 pasos</p>
            {esIPhone() ? (
              <ol className="text-sm text-muted flex flex-col gap-2 list-decimal pl-5">
                <li>Abrí esta página en <b>Safari</b> y tocá el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li>
                <li>Elegí <b>«Agregar a inicio»</b> y tocá <b>Agregar</b>.</li>
              </ol>
            ) : (
              <ol className="text-sm text-muted flex flex-col gap-2 list-decimal pl-5">
                <li>Tocá el menú <b>⋮</b> de arriba a la derecha de Chrome.</li>
                <li>Elegí <b>«Instalar aplicación»</b> o <b>«Agregar a la pantalla principal»</b>.</li>
              </ol>
            )}
            <p className="text-xs text-muted">Te queda el ícono de CARITO.SHOP junto a tus otras apps. No ocupa casi espacio y es gratis.</p>
            <button onClick={() => setAyuda(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-accent text-white">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
