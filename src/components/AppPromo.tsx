"use client";

import { useEffect, useState } from "react";
import { compartirApp, esIPhone, initPwa, instalarApp, onPwaChange, yaInstalada } from "@/lib/pwa";
import { ShareIcon } from "./ui";

/** Registra el service worker y captura el permiso de instalación apenas abre la tienda. */
export function PwaInit() {
  useEffect(() => initPwa(), []);
  return null;
}

const FRASES = ["Entrás en un toque, como cualquier app.", "Enterate primero de las ofertas.", "Es gratis y casi no ocupa espacio.", "Consultá y comprá por WhatsApp al instante."];
const FRASES_INSTALADA = ["Compartila con tus amigos y familia.", "Mandásela a quien busque tecnología.", "Cuantos más seamos, más ofertas traemos."];

/** Franja "Instalá la app / Compartir la app" de la portada. */
export function AppPromo() {
  const [instalada, setInstalada] = useState(true); // arranca oculta hasta saberlo (evita parpadeo)
  const [ayuda, setAyuda] = useState(false);
  const [frase, setFrase] = useState(0);
  const [vuelo, setVuelo] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrase((f) => f + 1), 3200);
    return () => clearInterval(t);
  }, []);

  const compartir = () => {
    setVuelo((v) => v + 1);
    compartirApp();
  };

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
      <section className="promo-card">
        <div className="promo-inner p-3 flex items-center gap-3">
          <div className="promo-telefono shrink-0 h-11 w-11 rounded-full bg-accent/15 flex items-center justify-center text-2xl" aria-hidden="true">
            {instalada ? "💜" : "📲"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">{instalada ? "¿Te gusta CARITO.SHOP?" : "Llevá CARITO.SHOP en tu celular"}</p>
            <p key={frase} className="promo-frase text-xs text-muted leading-snug">
              {(instalada ? FRASES_INSTALADA : FRASES)[frase % (instalada ? FRASES_INSTALADA : FRASES).length]}
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-1.5">
            {!instalada && (
              <button onClick={instalar} className="promo-pulso rounded-xl px-3 py-2 text-xs font-bold bg-accent text-white active:scale-95 transition">
                📲 Instalar
              </button>
            )}
            <button
              onClick={compartir}
              className="rounded-xl px-3 py-2 text-xs font-bold bg-surface-2 border border-border flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span key={vuelo} className={vuelo ? "promo-vuela inline-flex" : "inline-flex"}>
                <ShareIcon className="h-4 w-4" />
              </span>
              Compartir
            </button>
          </div>
        </div>
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
