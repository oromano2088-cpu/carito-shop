"use client";

import { useState } from "react";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";

export default function AdminIA() {
  const { reports, offers, generateAIReport, generateTargetedOffers, updateOfferStatus, customers } = useApp();
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const ultimoReporte = reports[0];

  const onGenerarReporte = () => {
    setLoadingReport(true);
    setTimeout(() => {
      generateAIReport();
      setLoadingReport(false);
    }, 1100);
  };

  const onGenerarOfertas = () => {
    setLoadingOffers(true);
    setTimeout(() => {
      generateTargetedOffers();
      setLoadingOffers(false);
    }, 1100);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-extrabold flex items-center gap-2">✨ Asistente IA</h1>
        <p className="text-sm text-muted mt-1">Reportes automáticos y ofertas pensadas para cada cliente, sin que tengas que analizar planillas.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">📊 Reporte automático</p>
          <Button className="!px-3 !py-2 text-xs" onClick={onGenerarReporte} disabled={loadingReport}>
            {loadingReport ? "Generando..." : "Generar reporte"}
          </Button>
        </div>
        {loadingReport && <p className="text-xs text-muted animate-pulse">🤖 Analizando ventas, stock y comportamiento de clientes...</p>}
        {!loadingReport && ultimoReporte && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted">{ultimoReporte.periodo} · generado {new Date(ultimoReporte.generadoEn).toLocaleString("es-AR")}</p>
            <p className="text-sm">{ultimoReporte.resumen}</p>
            <div>
              <p className="text-xs font-bold text-muted uppercase mb-1.5">Hallazgos</p>
              <ul className="flex flex-col gap-1.5">
                {ultimoReporte.hallazgos.map((h, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-accent">•</span> {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase mb-1.5">Recomendaciones</p>
              <ul className="flex flex-col gap-1.5">
                {ultimoReporte.recomendaciones.map((h, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-accent-2">✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {!loadingReport && !ultimoReporte && <p className="text-sm text-muted">Todavía no generaste ningún reporte.</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm">🎯 Ofertas para tentar clientes</p>
          <Button className="!px-3 !py-2 text-xs" onClick={onGenerarOfertas} disabled={loadingOffers}>
            {loadingOffers ? "Analizando..." : "Buscar oportunidades"}
          </Button>
        </div>
        {loadingOffers && <p className="text-xs text-muted animate-pulse mb-2">🤖 Cruzando likes, guardados y compras...</p>}
        <div className="flex flex-col gap-2.5">
          {offers.map((o) => {
            const cliente = customers.find((c) => c.id === o.clienteId);
            return (
              <div key={o.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold">{o.clienteNombre}</p>
                    <p className="text-xs text-muted">{o.productTitulo}</p>
                  </div>
                  <Badge tone="accent">-{o.descuentoSugerido}%</Badge>
                </div>
                <p className="text-xs text-muted">💡 {o.motivo}</p>
                <div className="flex gap-2">
                  {cliente && (
                    <a
                      href={waLink(
                        cliente.telefono,
                        `Hola ${o.clienteNombre}! Vimos que te interesó ${o.productTitulo} 👀. Te dejamos un ${o.descuentoSugerido}% de descuento especial si lo comprás hoy 🎁`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                      onClick={() => updateOfferStatus(o.id, "enviada")}
                    >
                      <Button className="w-full !py-2 text-xs">💬 Enviar oferta</Button>
                    </a>
                  )}
                  <Button variant="ghost" className="!py-2 text-xs" onClick={() => updateOfferStatus(o.id, "descartada")}>
                    Descartar
                  </Button>
                </div>
                {o.estado !== "sugerida" && <Badge tone={o.estado === "enviada" ? "success" : "default"}>{o.estado}</Badge>}
              </div>
            );
          })}
          {offers.length === 0 && !loadingOffers && (
            <p className="text-sm text-muted text-center py-6">Tocá &quot;Buscar oportunidades&quot; para que la IA analice a tus clientes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
