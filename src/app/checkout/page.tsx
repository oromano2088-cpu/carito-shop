"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store-context";
import { formatMoney, waLink } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import { Order } from "@/lib/types";

const STEPS = ["Datos", "Entrega", "Pago", "Listo"] as const;

export default function CheckoutPage() {
  const { cart, products, cartTotal, checkout, identity } = useApp();
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState<Order | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    const prefill = () => {
      if (!identity) return;
      setNombre((n) => n || identity.nombre);
      setTelefono((t) => t || identity.telefono);
    };
    prefill();
  }, [identity]);
  const [email, setEmail] = useState("");
  const [entrega, setEntrega] = useState<"envio" | "retiro">("envio");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState<"mercadopago" | "transferencia" | "efectivo">("mercadopago");
  const [cupon, setCupon] = useState("");

  if (cart.length === 0 && !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted">Tu carrito está vacío.</p>
        <Link href="/">
          <Button>Ir a comprar</Button>
        </Link>
      </main>
    );
  }

  const canNext =
    (step === 0 && nombre.trim() && telefono.trim()) ||
    (step === 1 && (entrega === "retiro" || direccion.trim())) ||
    step === 2;

  const finalize = () => {
    const o = checkout({ nombre, telefono, email, entrega, direccion, metodoPago, cuponCodigo: cupon || undefined });
    setOrder(o);
    setStep(3);
  };

  return (
    <main className="flex-1 pb-10">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= step ? "bg-accent text-white" : "bg-surface-2 text-muted"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-[11px] font-semibold ${i <= step ? "text-foreground" : "text-muted"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-accent" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-extrabold">¿A quién le enviamos el pedido?</h1>
            <Field label="Nombre y apellido">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Ej: Juan Pérez" />
            </Field>
            <Field label="WhatsApp / Teléfono">
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" placeholder="+54 9 11 5555-5555" />
            </Field>
            <Field label="Email (opcional)">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="tu@email.com" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-extrabold">¿Cómo lo querés recibir?</h1>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard active={entrega === "envio"} onClick={() => setEntrega("envio")} title="Envío a domicilio" desc="Te lo llevamos nosotros" icon="🚚" />
              <OptionCard active={entrega === "retiro"} onClick={() => setEntrega("retiro")} title="Retiro en local" desc="Sin costo de envío" icon="🏬" />
            </div>
            {entrega === "envio" && (
              <Field label="Dirección de entrega">
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input" placeholder="Calle, número, ciudad" />
              </Field>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-extrabold">¿Cómo pagás?</h1>
            <div className="flex flex-col gap-2">
              <OptionRow active={metodoPago === "mercadopago"} onClick={() => setMetodoPago("mercadopago")} title="Mercado Pago" desc="Tarjeta, cuotas o dinero en cuenta" icon="💳" />
              <OptionRow active={metodoPago === "transferencia"} onClick={() => setMetodoPago("transferencia")} title="Transferencia bancaria" desc="Te pasamos el CBU al confirmar" icon="🏦" />
              <OptionRow active={metodoPago === "efectivo"} onClick={() => setMetodoPago("efectivo")} title="Efectivo contra entrega" desc="Pagás al recibir el pedido" icon="💵" />
            </div>
            <Field label="Cupón de descuento (opcional)">
              <input value={cupon} onChange={(e) => setCupon(e.target.value.toUpperCase())} className="input" placeholder="Ej: BIENVENIDO10" />
            </Field>

            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 mt-2">
              <span className="text-sm font-bold mb-1">Resumen del pedido</span>
              {cart.map((line) => {
                const p = products.find((pp) => pp.id === line.productId);
                if (!p) return null;
                const precio = p.precioOferta ?? p.precio;
                return (
                  <div key={line.productId + line.varianteId} className="flex justify-between text-sm text-muted">
                    <span>{line.cantidad}× {p.titulo}</span>
                    <span>{formatMoney(precio * line.cantidad)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-extrabold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && order && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-accent-2/15 border border-accent-2/30 flex items-center justify-center text-3xl">✅</div>
            <h1 className="text-xl font-extrabold">¡Pedido confirmado!</h1>
            <p className="text-muted text-sm">
              Tu pedido <Badge tone="accent">#{order.id}</Badge> fue registrado. Te vamos a avisar por WhatsApp cada vez que cambie de estado.
            </p>
            <div className="bg-surface border border-border rounded-2xl p-4 w-full text-left">
              <div className="flex justify-between font-extrabold">
                <span>Total pagado</span>
                <span>{formatMoney(order.total)}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                {order.entrega === "envio" ? `Se envía a: ${order.direccion}` : "Retirás en nuestro local"}
              </p>
            </div>
            <a
              href={waLink("+5491100000000", `Hola! Acabo de hacer el pedido #${order.id} por ${formatMoney(order.total)}. Quiero coordinar la entrega.`)}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button className="w-full">Avisar por WhatsApp 💬</Button>
            </a>
            <Link href="/" className="w-full">
              <Button variant="secondary" className="w-full">
                Seguir comprando
              </Button>
            </Link>
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border px-4 py-3">
          <div className="mx-auto max-w-lg flex gap-3">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                ← Atrás
              </Button>
            )}
            <Button className="flex-1" disabled={!canNext} onClick={() => (step === 2 ? finalize() : setStep(step + 1))}>
              {step === 2 ? `Confirmar pedido · ${formatMoney(cartTotal)}` : "Continuar →"}
            </Button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

function OptionCard({ active, onClick, title, desc, icon }: { active: boolean; onClick: () => void; title: string; desc: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border flex flex-col gap-1 ${active ? "bg-accent/10 border-accent" : "bg-surface border-border"}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-sm">{title}</span>
      <span className="text-xs text-muted">{desc}</span>
    </button>
  );
}

function OptionRow({ active, onClick, title, desc, icon }: { active: boolean; onClick: () => void; title: string; desc: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3.5 rounded-2xl border flex items-center gap-3 ${active ? "bg-accent/10 border-accent" : "bg-surface border-border"}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="flex-1">
        <span className="font-bold text-sm block">{title}</span>
        <span className="text-xs text-muted">{desc}</span>
      </span>
      <span className={`h-5 w-5 rounded-full border-2 ${active ? "border-accent bg-accent" : "border-border"}`} />
    </button>
  );
}
