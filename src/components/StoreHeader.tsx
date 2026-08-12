"use client";

import Link from "next/link";

export function StoreHeader({
  search,
  onSearch,
  categorias,
  categoriaActiva,
  onCategoria,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  categorias?: string[];
  categoriaActiva?: string;
  onCategoria?: (c: string) => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg logo-badge flex items-center justify-center font-black neon-text">C</div>
          <span className="font-extrabold tracking-tight text-lg">
            CARITO<span className="neon-text">.SHOP</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-surface-2 border border-border text-xs font-semibold"
            aria-label="Ingresar al panel de administración"
          >
            🔒 Admin
          </Link>
          <a
            href="https://wa.me/5491100000000?text=Hola!%20Quiero%20hacer%20una%20consulta"
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-surface-2 border border-border text-lg"
            aria-label="WhatsApp"
          >
            💬
          </a>
        </div>
      </div>
      {onSearch && (
        <div className="mx-auto max-w-lg px-4 pb-3">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar celulares, notebooks, audio..."
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted outline-none focus:border-accent"
          />
        </div>
      )}
      {categorias && (
        <div className="mx-auto max-w-lg px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onCategoria?.("")}
            className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
              !categoriaActiva ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => onCategoria?.(c)}
              className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border ${
                categoriaActiva === c ? "bg-accent text-white border-accent" : "bg-surface-2 border-border text-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
