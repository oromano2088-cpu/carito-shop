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
      ⚡ Termina en {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </span>
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
