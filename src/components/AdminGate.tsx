"use client";

import { useEffect, useState } from "react";

// 🔒 PIN de acceso al panel admin. Cambialo por el que quieras usar.
const ADMIN_PIN = "2580";
const SESSION_KEY = "carito_admin_unlocked";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    setUnlocked(saved === "1");
    setChecked(true);
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === ADMIN_PIN) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
        setError(false);
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 500);
      }
    }
  }, [pin]);

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div className="flex-1 min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 bg-background">
        <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center text-3xl">🔒</div>
        <div className="text-center">
          <p className="font-extrabold text-lg">Panel de administración</p>
          <p className="text-sm text-muted mt-1">Ingresá el PIN para continuar</p>
        </div>

        <div className={`flex gap-3 ${error ? "animate-[shake_0.3s]" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 ${
                pin.length > i ? (error ? "bg-danger border-danger" : "bg-accent border-accent") : "border-border"
              }`}
            />
          ))}
        </div>
        {error && <p className="text-danger text-xs font-semibold -mt-3">PIN incorrecto</p>}

        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "borrar"].map((n, i) =>
            n === "" ? (
              <div key={i} />
            ) : n === "borrar" ? (
              <button
                key={i}
                onClick={() => setPin((p) => p.slice(0, -1))}
                className="h-16 rounded-2xl bg-surface-2 border border-border text-xl flex items-center justify-center active:scale-95 transition"
              >
                ⌫
              </button>
            ) : (
              <button
                key={i}
                onClick={() => pin.length < 4 && setPin((p) => p + n)}
                className="h-16 rounded-2xl bg-surface border border-border text-xl font-bold flex items-center justify-center active:scale-95 transition"
              >
                {n}
              </button>
            )
          )}
        </div>

        <a href="/" className="text-xs text-muted underline underline-offset-2 mt-2">
          ← Volver a la tienda
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "/";
}
