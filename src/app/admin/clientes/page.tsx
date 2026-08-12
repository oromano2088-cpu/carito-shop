"use client";

import { useState } from "react";
import { useApp } from "@/lib/store-context";
import { formatMoney, timeAgo, waLink } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";

export default function AdminClientes() {
  const { customers, registerDebtPayment } = useApp();
  const [tab, setTab] = useState<"todos" | "deudores" | "recurrentes">("todos");

  const filtered = customers.filter((c) => {
    if (tab === "deudores") return c.deuda > 0;
    if (tab === "recurrentes") return c.esRecurrente;
    return true;
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <h1 className="text-lg font-extrabold">Clientes ({customers.length})</h1>
      <div className="flex gap-2">
        <FilterChip active={tab === "todos"} onClick={() => setTab("todos")}>Todos</FilterChip>
        <FilterChip active={tab === "deudores"} onClick={() => setTab("deudores")}>Deudores</FilterChip>
        <FilterChip active={tab === "recurrentes"} onClick={() => setTab("recurrentes")}>Recurrentes</FilterChip>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">{c.nombre}</p>
                <p className="text-xs text-muted">{c.telefono}</p>
              </div>
              <div className="flex gap-1.5">
                {c.esRecurrente && <Badge tone="success">Recurrente</Badge>}
                {c.deuda > 0 && <Badge tone="danger">Debe {formatMoney(c.deuda)}</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface-2 rounded-xl py-2">
                <p className="font-bold text-sm">{formatMoney(c.totalComprado)}</p>
                <p className="text-muted">Comprado</p>
              </div>
              <div className="bg-surface-2 rounded-xl py-2">
                <p className="font-bold text-sm">{c.cantidadPedidos}</p>
                <p className="text-muted">Pedidos</p>
              </div>
              <div className="bg-surface-2 rounded-xl py-2">
                <p className="font-bold text-sm">{c.scoreInteres}%</p>
                <p className="text-muted">Interés</p>
              </div>
            </div>
            <p className="text-[11px] text-muted">{c.ultimaCompra ? `Última compra ${timeAgo(c.ultimaCompra)}` : "Todavía no compró"}</p>
            <div className="flex gap-2">
              <a href={waLink(c.telefono, `Hola ${c.nombre}! Te escribo de CARITO.SHOP 👋`)} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full !py-2 text-xs">💬 Escribir</Button>
              </a>
              {c.deuda > 0 && (
                <Button className="flex-1 !py-2 text-xs" onClick={() => registerDebtPayment(c.id, c.deuda)}>
                  Marcar pagado
                </Button>
              )}
            </div>
          </div>
        ))}
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
