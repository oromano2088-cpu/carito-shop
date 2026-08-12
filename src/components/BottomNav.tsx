"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store-context";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/feed", label: "Feed", icon: "🔥" },
  { href: "/guardados", label: "Guardados", icon: "🔖" },
  { href: "/carrito", label: "Carrito", icon: "🛒" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useApp();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto max-w-lg grid grid-cols-4">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                active ? "text-accent" : "text-muted"
              )}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              {it.label}
              {it.href === "/carrito" && cartCount > 0 && (
                <span className="absolute top-1 right-[calc(50%-22px)] bg-danger text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
