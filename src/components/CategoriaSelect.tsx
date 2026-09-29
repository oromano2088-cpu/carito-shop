"use client";

import { useEffect, useState } from "react";
import { useCategorias } from "@/lib/categorias";

// Selector de categoría con opción "➕ Nueva categoría" que queda guardada para la próxima vez.
export function CategoriaSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { categorias, agregar } = useCategorias();
  const [creando, setCreando] = useState(false);
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Si todavía no hay categoría elegida, tomar la primera de la lista.
  useEffect(() => {
    if (!value && categorias.length) onChange(categorias[0]);
  }, [value, categorias, onChange]);

  const opciones = value && !categorias.includes(value) ? [value, ...categorias] : categorias;

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const r = await agregar(nueva);
    setGuardando(false);
    if (!r.ok) {
      setError(r.error || "No se pudo guardar");
      return;
    }
    onChange(r.nombre);
    setNueva("");
    setCreando(false);
  };

  if (creando) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            autoFocus
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guardar()}
            className="input flex-1"
            placeholder="Nombre de la nueva categoría"
          />
          <button type="button" onClick={guardar} disabled={guardando || !nueva.trim()} className="px-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40">
            {guardando ? "…" : "Guardar"}
          </button>
          <button type="button" onClick={() => { setCreando(false); setNueva(""); setError(""); }} className="px-3 rounded-xl bg-surface-2 border border-border text-sm">
            ✕
          </button>
        </div>
        {error && <p className="text-xs text-danger font-semibold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input flex-1">
        {opciones.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setCreando(true)}
        className="px-3 rounded-xl bg-surface-2 border border-border text-lg font-bold"
        aria-label="Agregar nueva categoría"
        title="Agregar nueva categoría"
      >
        +
      </button>
    </div>
  );
}
