"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookmarkIcon, ShareIcon } from "./ui";

const STORAGE_KEY = "carito_guia_v1";
const OPEN_EVENT = "carito:abrir-guia";

type Paso = { icono: React.ReactNode; titulo: string; texto: string };

const PASOS: Paso[] = [
  {
    icono: <span className="text-4xl">👋</span>,
    titulo: "¡Bienvenida/o a CARITO.SHOP!",
    texto: "Te mostramos en 30 segundos todo lo que podés hacer. Podés saltear la guía cuando quieras.",
  },
  {
    icono: <span className="text-4xl">🤍</span>,
    titulo: "Me gusta",
    texto: "Tocá el corazón (o tocá dos veces la foto) para marcar lo que te encanta. Así sabemos qué productos traer más.",
  },
  {
    icono: <BookmarkIcon className="h-10 w-10" />,
    titulo: "Guardar para después",
    texto: "Tocá el marcador para guardar un producto y comprarlo más adelante. Los encontrás siempre en la pestaña «Guardados» de abajo.",
  },
  {
    icono: <ShareIcon className="h-10 w-10" />,
    titulo: "Compartir",
    texto: "Tocá el avioncito para mandarle el producto a un amigo o familiar por WhatsApp, con foto, precio y link.",
  },
  {
    icono: <span className="text-4xl">💬</span>,
    titulo: "Consultar con la vendedora",
    texto: "¿Dudas de stock, colores o envío? El botón verde de WhatsApp te conecta directo con nosotros, con el producto ya escrito en el mensaje.",
  },
  {
    icono: <span className="text-4xl">🛒</span>,
    titulo: "Carrito y pedido",
    texto: "Agregá productos al carrito y confirmá el pedido. Coordinamos pago (efectivo, transferencia o Mercado Pago) y entrega por WhatsApp.",
  },
  {
    icono: <span className="text-4xl">🔥</span>,
    titulo: "Feed",
    texto: "En la pestaña «Feed» ves los productos a pantalla completa: deslizá hacia arriba para pasar al siguiente. ¿Olvidaste algo? Tocá «?» arriba para ver esta guía de nuevo.",
  },
];

function marcarVista() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

function yaVista() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true; // sin storage no la mostramos sola (evita que aparezca en cada visita)
  }
}

/** Botón "?" para volver a abrir la guía. */
export function AyudaButton({ dark }: { dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      aria-label="Cómo usar la tienda"
      title="Cómo usar la tienda"
      className={
        dark
          ? "h-8 w-8 rounded-full bg-white/10 backdrop-blur text-white text-sm font-bold"
          : "h-9 w-9 rounded-full bg-surface-2 border border-border text-sm font-bold"
      }
    >
      ?
    </button>
  );
}

/** Guía paso a paso: aparece sola la primera visita y se reabre con el botón "?". */
export function Guia() {
  const pathname = usePathname();
  const [abierta, setAbierta] = useState(false);
  const [paso, setPaso] = useState(0);
  const oculta = pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");

  useEffect(() => {
    const abrir = () => {
      setPaso(0);
      setAbierta(true);
    };
    window.addEventListener(OPEN_EVENT, abrir);
    return () => window.removeEventListener(OPEN_EVENT, abrir);
  }, []);

  useEffect(() => {
    if (oculta || yaVista()) return;
    const t = setTimeout(() => setAbierta(true), 1200);
    return () => clearTimeout(t);
  }, [oculta]);

  if (!abierta || oculta) return null;

  const cerrar = () => {
    marcarVista();
    setAbierta(false);
  };
  const ultimo = paso === PASOS.length - 1;
  const p = PASOS[paso];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Guía de uso">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Paso {paso + 1} de {PASOS.length}
          </span>
          <button onClick={cerrar} className="font-semibold hover:text-foreground">
            Saltar guía
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="h-20 w-20 rounded-full bg-accent/15 text-accent flex items-center justify-center">{p.icono}</div>
          <h2 className="text-lg font-extrabold">{p.titulo}</h2>
          <p className="text-sm text-muted leading-relaxed">{p.texto}</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {PASOS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === paso ? "w-5 bg-accent" : "w-1.5 bg-border"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {paso > 0 && (
            <button onClick={() => setPaso(paso - 1)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-surface-2 border border-border">
              Anterior
            </button>
          )}
          <button
            onClick={() => (ultimo ? cerrar() : setPaso(paso + 1))}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-accent text-white"
          >
            {ultimo ? "¡Listo, a comprar!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
