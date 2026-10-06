"use client";

import { useEffect, useState } from "react";
import { cn, timeLeft } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" | "danger" | "warn" | "success" }) {
  const tones: Record<string, string> = {
    default: "bg-surface-2 text-muted border border-border",
    accent: "bg-accent/15 text-accent border border-accent/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    warn: "bg-warn/15 text-warn border border-warn/30",
    success: "bg-accent-2/15 text-accent-2 border border-accent-2/30",
  };
  return <span className={cn("text-[11px] font-medium px-2 py-1 rounded-full", tones[tone])}>{children}</span>;
}

export function CountdownChip({ iso }: { iso?: string }) {
  const [left, setLeft] = useState(() => timeLeft(iso));
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setLeft(timeLeft(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!left) return null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-danger/15 text-danger border border-danger/30">
      ⚡ Termina en {left.h >= 24 && `${Math.floor(left.h / 24)}d `}{pad(left.h % 24)}:{pad(left.m)}:{pad(left.s)}
    </span>
  );
}

/** Banner grande de oferta para la ficha de producto: contador bien visible + ahorro. */
export function OfertaBanner({ iso, ahorro }: { iso?: string; ahorro?: string }) {
  const [left, setLeft] = useState(() => timeLeft(iso));
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setLeft(timeLeft(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!left) return null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dias = Math.floor(left.h / 24);
  const ultimaHora = left.h < 1;
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-white shadow-lg ${ultimaHora ? "animate-pulse" : ""}`}
      style={{ background: "linear-gradient(90deg,#e11d48,#f97316)" }}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold tracking-wider uppercase">⚡ {ultimaHora ? "¡Última hora!" : "Oferta por tiempo limitado"}</span>
        {ahorro && <span className="text-xs font-semibold opacity-90">{ahorro}</span>}
      </div>
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[10px] font-semibold uppercase opacity-90">Termina en</span>
        <span className="text-xl font-extrabold tabular-nums">
          {dias > 0 && `${dias}d `}{pad(left.h % 24)}:{pad(left.m)}:{pad(left.s)}
        </span>
      </div>
    </div>
  );
}

export function IconButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center h-10 w-10 rounded-full transition active:scale-90",
        active ? "bg-accent text-white" : "bg-surface-2 text-foreground border border-border"
      )}
    >
      {children}
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:brightness-110",
    secondary: "bg-surface-2 text-foreground border border-border hover:bg-border",
    ghost: "bg-transparent text-foreground hover:bg-surface-2",
    danger: "bg-danger text-white hover:brightness-110",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-3 rounded-xl font-semibold text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/** Ícono "Compartir": avión de papel (el que usa Instagram/Telegram para enviar). */
export function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

/** Ícono "Guardar": marcador, relleno cuando está guardado. */
export function BookmarkIcon({ filled, className = "h-5 w-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
