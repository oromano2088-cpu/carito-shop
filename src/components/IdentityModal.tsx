"use client";

import { useState } from "react";
import { useApp } from "@/lib/store-context";

export function IdentityModal() {
  const { identityModalOpen, closeIdentityModal, identify } = useApp();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");

  if (!identityModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const digitos = telefono.replace(/[^0-9]/g, "");
    if (nombreLimpio.length < 2) {
      setError("Ingresá tu nombre");
      return;
    }
    if (digitos.length < 8) {
      setError("Ingresá un número de WhatsApp válido");
      return;
    }
    setError("");
    identify(nombreLimpio, telefono.trim());
    setNombre("");
    setTelefono("");
  };

  const handleClose = () => {
    setNombre("");
    setTelefono("");
    setError("");
    closeIdentityModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-2xl">💬</div>
          <p className="font-extrabold text-lg">Antes de continuar</p>
          <p className="text-sm text-muted">
            Dejanos tu nombre y WhatsApp para guardar tus me gusta y guardados, y así poder avisarte de ofertas especiales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-semibold">Nombre</label>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-semibold">WhatsApp</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 9 11 5555-5555"
              inputMode="tel"
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-danger text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            className="mt-1 h-12 rounded-xl bg-accent font-bold text-sm active:scale-95 transition"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-muted underline underline-offset-2"
          >
            Ahora no
          </button>
        </form>
      </div>
    </div>
  );
}
