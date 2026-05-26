import { createClient } from '@supabase/supabase-js';
import { Metadata } from "next";

const supabaseUrl = 'https://acjufczrwyztsmzmljdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjanVmY3pyd3l6dHNtem1samRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDk2ODUsImV4cCI6MjA5NDM4NTY4NX0.05hhZnnaF1U-X_XQpaeNb5JNB3dqYkK-4eqtlpE2UW0';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: p } = await supabase.from("productos").select("*").eq("id", params.id).single();
  if (!p) return { title: "Producto no encontrado - CARITO.SHOP" };
  return {
    title: p.nombre + " - CARITO.SHOP",
    description: p.descripcion || "Tu tienda favorita",
    openGraph: {
      title: p.nombre + " - CARITO.SHOP",
      description: "💰 $" + p.precio.toLocaleString("es-AR") + " | " + (p.descripcion || ""),
      images: [{ url: p.imagen, width: 800, height: 800, alt: p.nombre }],
      url: "https://carito-shop.vercel.app/producto/" + p.id,
      siteName: "CARITO.SHOP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.nombre + " - CARITO.SHOP",
      description: "💰 $" + p.precio.toLocaleString("es-AR"),
      images: [p.imagen],
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: p } = await supabase.from("productos").select("*").eq("id", params.id).single();

  if (!p) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={{ color: "#ff2d78" }}>Producto no encontrado</h2>
        <a href="/" style={{ color: "#ff2d78", textDecoration: "none" }}>Volver a la tienda</a>
      </div>
    </main>
  );

  const imagenes = [p.imagen, p.imagen2, p.imagen3].filter(Boolean);

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", color: "#fff" }}>
      <header style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #ff2d78", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#ff2d78", textShadow: "0 0 10px #ff2d78", fontFamily: "Georgia, serif" }}>CARITO.SHOP</div>
        <a href="/" style={{ color: "#ff2d78", fontSize: 13, textDecoration: "none", border: "1px solid #ff2d78", padding: "6px 12px", borderRadius: 8 }}>Ver tienda</a>
      </header>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
        {imagenes.length > 0 && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20, background: "#111", border: "1px solid #ff2d78" }}>
            <img src={imagenes[0] as string} alt={p.nombre} style={{ width: "100%", maxHeight: 350, objectFit: "contain", background: "#0a0a0a" }} />
            {imagenes.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: 10 }}>
                {imagenes.slice(1).map((img, i) => (
                  <img key={i} src={img as string} style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #333" }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#ff2d78", fontWeight: 600, marginBottom: 6 }}>{p.categoria}</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: "#fff" }}>{p.nombre}</h1>
          {p.descripcion && <p style={{ color: "#888", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{p.descripcion}</p>}
          <div style={{ fontSize: 32, fontWeight: 900, color: "#ff2d78", marginBottom: 6 }}>
            {"$" + p.precio.toLocaleString("es-AR")}
          </div>
          {p.stock <= 3 && p.stock > 0 && (
            <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 700, marginBottom: 10 }}>
              Ultimas {p.stock} unidades
            </div>
          )}
        </div>

        <a href={"https://wa.me/5491133851488?text=" + encodeURIComponent("Hola CARITO.SHOP! Me interesa: " + p.nombre + " - $" + p.precio.toLocaleString("es-AR") + "\nVi el producto en: https://carito-shop.vercel.app/?id=" + p.id)}
          target="_blank"
          style={{ display: "block", width: "100%", padding: 16, background: "#25D366", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 16, textAlign: "center", textDecoration: "none", marginBottom: 10, boxSizing: "border-box" }}>
          💬 Consultar por WhatsApp
        </a>

        <a href="/" style={{ display: "block", width: "100%", padding: 14, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 15, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
          🛍️ Ver toda la tienda
        </a>
      </div>
    </main>
  );
}