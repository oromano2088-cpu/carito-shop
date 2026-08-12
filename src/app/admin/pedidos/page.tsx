"use client";

import { useState } from "react";
import { useApp } from "@/lib/store-context";
import { formatMoney, timeAgo, waLink } from "@/lib/utils";
import { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo_envio: "Listo para envío",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_TONE: Record<OrderStatus, "default" | "accent" | "danger" | "warn" | "success"> = {
  pendiente: "warn",
  confirmado: "accent",
  preparando: "accent",
  listo_envio: "accent",
  en_camino: "accent",
  entregado: "success",
  cancelado: "danger",
};

export default function AdminPedidos() {
  const { orders, updateOrderStatus } = useApp();
  const [filtro, setFiltro] = useState<OrderStatus | "todos">("todos");
  const filtered = filtro === "todos" ? orders : orders.filter((o) => o.status === filtro);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <h1 className="text-lg font-extrabold">Pedidos ({orders.length})</h1>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <FilterChip active={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</FilterChip>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <FilterChip key={s} active={filtro === s} onClick={() => setFiltro(s)}>
            {STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((o) => (
          <div key={o.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">#{o.id} · {o.cliente.nombre}</p>
                <p className="text-xs text-muted">{o.cliente.telefono} · {timeAgo(o.creadoEn)}</p>
              </div>
              <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
            </div>
            <div className="flex flex-col gap-1">
              {o.items.map((it) => (
                <p key={it.productId} className="text-xs text-muted">
                  {it.cantidad}× {it.titulo} {it.variante ? `(${it.variante})` : ""}
                </p>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>{o.entrega === "envio" ? `📦 Envío: ${o.direccion}` : "🏬 Retiro en local"}</span>
              <span>{formatMoney(o.total)}</span>
            </div>
            <div className="flex gap-2 items-center pt-1">
              <select
                value={o.status}
                onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              >
                {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <a
                href={waLink(o.cliente.telefono, `Hola ${o.cliente.nombre}! Tu pedido #${o.id} está: ${STATUS_LABEL[o.status]}.`)}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-accent-2/15 border border-accent-2/30"
                aria-label="Avisar por WhatsApp"
              >
                💬
              </a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted text-sm py-10">No hay pedidos en este estado.</p>}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
        active ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
      }`}
    >
      {children}
    </button>
  );
}
