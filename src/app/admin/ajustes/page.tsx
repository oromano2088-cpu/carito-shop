"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeWhatsapp } from "@/lib/site";
import { fetchWhatsapp } from "@/lib/whatsapp";
import { PIN_KEY } from "@/components/AdminGate";
import { Button } from "@/components/ui";

function mostrar(n: string) {
  // 5491141768461 -> 11 4176-8461
  const local = n.startsWith("549") ? n.slice(3) : n;
  return local.length === 10 ? `${local.slice(0, 2)} ${local.slice(2, 6)}-${local.slice(6)}` : local;
}

export default function AdminAjustes() {
  const [actual, setActual] = useState("");
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchWhatsapp(true).then((n) => {
      setActual(n);
      setValor(mostrar(n));
    });
  }, []);

  const normalizado = normalizeWhatsapp(valor);

  const guardar = async () => {
    setEstado(null);
    if (!normalizado) {
      setEstado({ tipo: "error", texto: "Revisá el número: tiene que tener característica y número, 10 dígitos en total (ej. 11 4176-8461)." });
      return;
    }
    if (!supabase) {
      setEstado({ tipo: "error", texto: "La tienda no está conectada a la base de datos." });
      return;
    }
    setGuardando(true);
    const pin = sessionStorage.getItem(PIN_KEY) || "";
    const { error } = await supabase.rpc("set_setting", { p_pin: pin, p_key: "whatsapp", p_value: normalizado });
    setGuardando(false);
    if (error) {
      setEstado({
        tipo: "error",
        texto: error.message.includes("PIN") ? "PIN vencido: tocá el candado 🔒, volvé a entrar y guardá de nuevo." : "No se pudo guardar. Probá de nuevo en un momento.",
      });
      return;
    }
    const nuevo = await fetchWhatsapp(true);
    setActual(nuevo);
    setEstado({ tipo: "ok", texto: "Guardado. La tienda ya usa este número." });
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <h1 className="text-lg font-extrabold">Ajustes</h1>

      <section className="rounded-2xl p-4 bg-surface border border-border flex flex-col gap-3">
        <div>
          <p className="font-bold text-sm">WhatsApp de la tienda</p>
          <p className="text-xs text-muted mt-1">
            Es el número al que llegan las consultas y los pedidos. Escribilo como lo marcarías en tu celular, sin 0 ni 15.
          </p>
        </div>

        <input
          type="tel"
          inputMode="tel"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="11 4176-8461"
          className="w-full rounded-xl bg-surface-2 border border-border px-3 py-3 text-base"
          aria-label="Número de WhatsApp"
        />

        <p className="text-xs text-muted">
          {normalizado ? (
            <>Se va a usar: <span className="font-mono">+{normalizado}</span></>
          ) : (
            "Número incompleto"
          )}
        </p>

        <div className="flex gap-2">
          <Button onClick={guardar} disabled={guardando || !normalizado || normalizado === actual} className="flex-1">
            {guardando ? "Guardando…" : "Guardar número"}
          </Button>
          {actual && (
            <a
              href={`https://wa.me/${actual}?text=${encodeURIComponent("Prueba desde el panel de CARITO.SHOP")}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-surface-2 border border-border"
            >
              Probar
            </a>
          )}
        </div>

        {estado && (
          <p className={`text-xs font-semibold ${estado.tipo === "ok" ? "text-accent" : "text-danger"}`}>{estado.texto}</p>
        )}
      </section>
    </div>
  );
}
