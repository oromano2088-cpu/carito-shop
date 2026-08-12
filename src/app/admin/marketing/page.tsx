"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { waLink } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";

export default function AdminMarketing() {
  const { coupons, addCoupon, products } = useApp();
  const [codigo, setCodigo] = useState("");
  const [valor, setValor] = useState("10");
  const [tipo, setTipo] = useState<"porcentaje" | "monto_fijo">("porcentaje");

  const topEngagement = [...products].sort((a, b) => b.compartidos - a.compartidos).slice(0, 3);

  const crearCupon = () => {
    if (!codigo.trim()) return;
    addCoupon({ codigo: codigo.toUpperCase(), tipo, valor: Number(valor), activo: true });
    setCodigo("");
  };

  const compartirPost = (titulo: string) => {
    const texto = `🔥 ¡Oferta especial en CARITO.SHOP! ${titulo} con descuento por tiempo limitado. Escribinos y te contamos más 👇`;
    window.open(waLink("", texto), "_blank");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <h1 className="text-lg font-extrabold">Marketing</h1>

      <Link
        href="/admin/ia"
        className="rounded-2xl p-4 bg-gradient-to-br from-accent/20 to-accent-2/10 border border-accent/30 flex items-center gap-3"
      >
        <span className="text-2xl">🎯</span>
        <div className="flex-1">
          <p className="font-bold text-sm">Ofertas segmentadas con IA</p>
          <p className="text-xs text-muted">Descuentos automáticos para clientes que dieron like/guardaron y no compraron.</p>
        </div>
        <span className="text-accent font-bold">→</span>
      </Link>

      <div>
        <p className="font-bold text-sm mb-2">📣 Compartir en redes</p>
        <p className="text-xs text-muted mb-3">Generá el posteo listo para compartir en WhatsApp Estados, Instagram y Facebook.</p>
        <div className="flex flex-col gap-2">
          {topEngagement.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagen} alt={p.titulo} className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.titulo}</p>
                <p className="text-xs text-muted">↗️ {p.compartidos} compartidos · ❤️ {p.likes}</p>
              </div>
              <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={() => compartirPost(p.titulo)}>
                Compartir
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-bold text-sm mb-2">🏷️ Cupones activos</p>
        <div className="flex flex-col gap-2 mb-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-surface border border-border rounded-2xl p-3">
              <div>
                <p className="text-sm font-bold">{c.codigo}</p>
                <p className="text-xs text-muted">{c.tipo === "porcentaje" ? `${c.valor}% off` : `$${c.valor} off`} · usado {c.usosActuales} veces</p>
              </div>
              <Badge tone={c.activo ? "success" : "default"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
          ))}
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Crear nuevo cupón</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="CODIGO"
              className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
            />
            <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="porcentaje">% Porcentaje</option>
              <option value="monto_fijo">$ Monto fijo</option>
            </select>
          </div>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            type="number"
            placeholder="Valor"
            className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <Button onClick={crearCupon}>Crear cupón</Button>
        </div>
      </div>
    </div>
  );
}
