"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

type Producto = { id: number; nombre: string; descripcion: string; precio: number; emoji: string; activo: boolean; imagen: string; };
type Item = Producto & { cantidad: number };
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };

export default function Home() {
  const [lista, setLista] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data } = await supabase.from("productos").select("*").eq("activo", true);
    if (data) setLista(data);
    setCargando(false);
  };

  const agregar = (p: Producto) => {
    setCarrito(prev => {
      const e = prev.find(i => i.id === p.id);
      if (e) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...p, cantidad: 1 }];
    });
    setToast("Agregado: " + p.nombre);
    setTimeout(() => setToast(""), 2000);
  };

  const quitar = (id: number) => setCarrito(prev => prev.filter(i => i.id !== id));
  const totalU = carrito.reduce((s, i) => s + i.cantidad, 0);
  const totalP = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const wa = () => {
    const msg = "Hola CARITO.SHOP!\n" + carrito.map(i => i.nombre + " x" + i.cantidad).join("\n") + "\nTotal: $" + totalP.toLocaleString("es-AR");
    window.open("https://wa.me/5491133851488?text=" + encodeURIComponent(msg), "_blank");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif" }}>
      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}
      {abierto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setAbierto(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", width: 320, background: "#111", borderLeft: "1px solid #ff2d78", height: "100%", display: "flex", flexDirection: "column", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ ...neon, fontSize: 18, fontWeight: 900 }}>Tu carrito</span>
              <button onClick={() => setAbierto(false)} style={{ background: "none", border: "1px solid #ff2d78", color: "#ff2d78", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>X</button>
            </div>
            {carrito.length === 0 && (
              <div style={{ textAlign: "center", color: "#555", marginTop: 60 }}>
                <div style={{ fontSize: 48 }}>🛒</div>
                <div style={{ marginTop: 12 }}>Carrito vacio</div>
              </div>
            )}
            {carrito.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {carrito.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #222" }}>
                      <span style={{ fontSize: 28 }}>{item.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{item.nombre}</div>
                        <div style={{ color: "#ff2d78", fontWeight: 800 }}>{"$" + (item.precio * item.cantidad).toLocaleString("es-AR")}</div>
                        <div style={{ color: "#555", fontSize: 12 }}>{"x" + item.cantidad}</div>
                      </div>
                      <button onClick={() => quitar(item.id)} style={{ background: "none", border: "none", color: "#ff2d78", cursor: "pointer", fontSize: 16 }}>X</button>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #ff2d78", paddingTop: 16, marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ color: "#fff", fontWeight: 700 }}>Total</span>
                    <span style={{ color: "#ff2d78", fontSize: 20, fontWeight: 900 }}>{"$" + totalP.toLocaleString("es-AR")}</span>
                  </div>
                  <button style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Finalizar compra</button>
                  <button onClick={wa} style={{ width: "100%", padding: 11, background: "transparent", border: "1px solid #25D366", borderRadius: 12, color: "#25D366", fontWeight: 700, cursor: "pointer" }}>Pedir por WhatsApp</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <header style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #ff2d78", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, ...neon, fontFamily: "Georgia, serif" }}>CARITO.SHOP</div>
            <div style={{ fontSize: 11, color: "#fff", fontStyle: "italic" }}>Tu tienda favorita</div>
          </div>
          <button onClick={() => setAbierto(true)} style={{ background: "transparent", border: "2px solid #fff", borderRadius: 12, padding: "10px 16px", color: "#fff", fontWeight: 800, cursor: "pointer" }}>{"Carrito (" + totalU + ")"}</button>
        </div>
      </header>
      <section style={{ background: "linear-gradient(135deg, #1a0010 0%, #0a0a0a 50%, #1a0010 100%)", textAlign: "center", padding: "70px 20px", borderBottom: "1px solid #ff2d78" }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12, ...neon, fontFamily: "Georgia, serif" }}>Tu tienda favorita</h2>
        <p style={{ color: "#ccc", fontSize: 17, marginBottom: 0 }}>Envios a todo el pais - Paga con MercadoPago</p>
      </section>
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 20px" }}>
        <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 28, ...neon }}>Nuestros productos</h3>
        {cargando && <div style={{ textAlign: "center", color: "#ff2d78", padding: 60 }}>Cargando...</div>}
        {!cargando && lista.length === 0 && (
          <div style={{ textAlign: "center", color: "#555", padding: 60 }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <div style={{ marginTop: 12 }}>No hay productos aun</div>
          </div>
        )}
        {!cargando && lista.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {lista.map(p => (
              <div key={p.id} style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ height: 200, overflow: "hidden", borderBottom: "1px solid #ff2d78" }}>
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ background: "linear-gradient(135deg, #1a0010, #0a0a0a)", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70 }}>
                      {p.emoji}
                    </div>
                  )}
                </div>
                <div style={{ padding: 18 }}>
                  <h4 style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{p.nombre}</h4>
                  <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>{p.descripcion}</p>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#ff2d78" }}>{"$" + p.precio.toLocaleString("es-AR")}</span>
                  </div>
                  <button onClick={() => agregar(p)} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Agregar al carrito</button>
                  <button onClick={() => {
  const msg = "Hola CARITO.SHOP! Me interesa: " + p.nombre + " - $" + p.precio.toLocaleString("es-AR");
  window.open("https://wa.me/5491133851488?text=" + encodeURIComponent(msg), "_blank");
}} style={{ width: "100%", padding: 10, background: "transparent", border: "1px solid #25D366", borderRadius: 12, color: "#25D366", fontWeight: 700, cursor: "pointer" }}>
  Consultar por WhatsApp
</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <footer style={{ textAlign: "center", padding: 28, borderTop: "1px solid #ff2d78", color: "#555", fontSize: 13 }}>
        2026 CARITO.SHOP - Hecho con amor en Argentina
      </footer>
    </main>
  );
}