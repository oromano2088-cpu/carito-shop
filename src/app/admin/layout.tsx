"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminGate, lockAdmin } from "@/components/AdminGate";

const items = [
  { href: "/admin", label: "Panel", icon: "📊" },
  { href: "/admin/productos", label: "Productos", icon: "📦" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/clientes", label: "Clientes", icon: "👥" },
  { href: "/admin/marketing", label: "Marketing", icon: "🎯" },
  { href: "/admin/ia", label: "Asistente IA", icon: "✨" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AdminGate>
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg logo-badge flex items-center justify-center font-black neon-text">C</div>
            <div>
              <p className="font-extrabold leading-none">CARITO.SHOP</p>
              <p className="text-[11px] text-muted leading-none mt-1">Panel de administración</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={lockAdmin}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-sm"
              aria-label="Bloquear panel"
            >
              🔒
            </button>
            <Link href="/" className="text-xs font-semibold bg-surface-2 border border-border px-3 py-1.5 rounded-full">
              Ver tienda ↗
            </Link>
          </div>
        </header>

        <div className="flex-1 pb-20 mx-auto w-full max-w-3xl">{children}</div>

        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-3xl grid grid-cols-6">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium", active ? "text-accent" : "text-muted")}
                >
                  <span className="text-base leading-none">{it.icon}</span>
                  {it.label}
                </Link>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </AdminGate>
  );
}
