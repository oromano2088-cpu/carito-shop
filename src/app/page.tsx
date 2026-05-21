"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

type Producto = { 
  id: number; 
  nombre: string; 
  descripcion: string; 
  precio: number; 
  precio_oferta: number | null; 
  oferta_hasta: string | null; 
  emoji: string; 
  activo: boolean; 
  imagen: string; 
  imagen2: string; 
  imagen3: string; 
  categoria: string; 
  stock: number; 
};
type Item = Producto & { cantidad: number };
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };

function getImagenes(p: Producto) {
  return [p.imagen, p.imagen2, p.imagen3].filter(Boolean) as string[];
}

export default function Home() {
  const [lista, setLista] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState("");
  const [cargando, setCargando] = useState(true);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", direccion: "" });
  const [enviando, setEnviando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [visor, setVisor] = useState<{ imagenes: string[]; indice: number } | null>(null);
  const [indicesProducto, setIndicesProducto] = useState<{ [id: number]: number }>({});
  
  const [ofertaActiva, setOfertaActiva] = useState<Producto | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutes: 0, segundos: 0 });

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!ofertaActiva || !ofertaActiva.oferta_hasta) return;

    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const limite = new Date(ofertaActiva.oferta_hasta!).getTime();
      const distancia = limite - ahora;

      if (distancia < 0) {
        clearInterval(intervalo);
        setOfertaActiva(null);
      } else {
        setTiempoRestante({
          dias: Math.floor(distancia / (1000 * 60 * 60 * 24)),
          horas: Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((distancia % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ofertaActiva]);

  const init = async () => {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).gt("stock", 0);
    if (data) {
      setLista(data);
      const cats = ["Todos", ...Array.from(new Set(data.map((p: Producto) => p.categoria).filter(Boolean)))];
      setCategorias(cats);

      const ahoraIso = new Date().toISOString();
      const enOferta = data.find((p: Producto) => p.precio_oferta && p.oferta_hasta && p.oferta_hasta > ahoraIso);
      if (enOferta) {
        setOfertaActiva(enOferta);
      }
    }
    setCargando(false);
  };

  const listaFiltrada = categoriaActiva === "Todos" ? lista : lista.filter(p => p.categoria === categoriaActiva);

  const agregar = (p: Producto) => {
    const enCarrito = carrito.find(i => i.id === p.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    if (cantidadEnCarrito >= p.stock) { setToast("No hay mas stock disponible"); setTimeout(() => setToast(""), 2000); return; }
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
  
  const totalP = carrito.reduce((s, i) => {
    const precioFinal = i.precio_oferta && i.oferta_hasta && new Date(i.oferta_hasta).getTime() > new Date().getTime() ? i.precio_oferta : i.precio;
    return s + (precioFinal * i.cantidad);
  }, 0);

  const wa = () => {
    const msg = "Hola CARITO.SHOP!\n" + carrito.map(i => {
      const pFinal = i.precio_oferta && i.oferta_hasta && new Date(i.oferta_hasta).getTime() > new Date().getTime() ? i.precio_oferta : i.precio;
      return i.nombre + " x" + i.cantidad + " ($" + pFinal.toLocaleString("es-AR") + ")";
    }).join("\n") + "\nTotal: $" + totalP.toLocaleString("es-AR");
    window.open("https://wa.me/5491133851488?text=" + encodeURIComponent(msg), "_blank");
  };

  const compartirProducto = (p: Producto) => {
    const pFinal = p.precio_oferta && p.oferta_hasta && new Date(p.oferta_hasta).getTime() > new Date().getTime() ? p.precio_oferta : p.precio;
    const msg = "Mira este producto de CARITO.SHOP!\n\n" + p.nombre + "\n$" + pFinal.toLocaleString("es-AR") + "\n\n" + p.descripcion + "\n\nCompralo en: carito-shop.vercel.app";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const confirmarPedido = async () => {
    if (!form.nombre || !form.telefono) { setToast("Completa nombre y telefono"); return; }
    setEnviando(true);
    const productos = carrito.map(i => i.nombre + " x" + i.cantidad).join(", ");
    await supabase.from("pedidos").insert({
      cliente_nombre: form.nombre,
      cliente_telefono: form.telefono,
      cliente_direccion: form.direccion,
      productos: productos,
      total: totalP,
      estado: "pendiente",
    });
    const msg = "Hola CARITO.SHOP! Hice un pedido:\n" + productos + "\nTotal: $" + totalP.toLocaleString("es-AR") + "\nNombre: " + form.nombre + "\nTel: " + form.telefono + "\nDirec: " + form.direccion;
    window.open("https://wa.me/5491133851488?text=" + encodeURIComponent(msg), "_blank");
    setEnviando(false);
    setPedidoOk(true);
    setCarrito([]);
    setCheckout(false);
    setAbierto(false);
    setForm({ nombre: "", telefono: "", direccion: "" });
  };

  const cambiarIndice = (id: number, dir: number, total: number) => {
    setIndicesProducto(prev => {
      const actual = prev[id] || 0;
      const nuevo = (actual + dir + total) % total;
      return { ...prev, [id]: nuevo };
    });
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif" }}>

      {/* VISOR PANTALLA COMPLETA */}
      {visor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.97)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setVisor(null)}>
          <button onClick={() => setVisor(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", borderRadius: 50, width: 44, height: 44 }}>✕</button>
          {visor.imagenes.length > 1 && (
            <button onClick={e => { e.stopPropagation(); setVisor(prev => prev ? { ...prev, indice: (prev.indice - 1 + prev.imagenes.length) % prev.imagenes.length } : null); }}
              style={{ position: "absolute", left: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", borderRadius: 50, width: 44, height: 44 }}>‹</button>
          )}
          <img src={visor.imagenes[visor.indice]} onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12 }} />
          {visor.imagenes.length > 1 && (
            <button onClick={e => { e.stopPropagation(); setVisor(prev => prev ? { ...prev, indice: (prev.indice + 1) % prev.imagenes.length } : null); }}
              style={{ position: "absolute", right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", borderRadius: 50, width: 44, height: 44 }}>›</button>
          )}
          {visor.imagenes.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8 }}>
              {visor.imagenes.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setVisor(prev => prev ? { ...prev, indice: i } : null); }}
                  style={{ width: 8, height: 8, borderRadius: 50, background: i === visor.indice ? "#ff2d78" : "#555", cursor: "pointer" }} />
              ))}
            </div>
          )}
        </div>
      )}

      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, zIndex: 9000 }}>
          {toast}
        </div>
      )}

      {pedidoOk && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 320 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Pedido confirmado</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Te vamos a contactar pronto para coordinar el pago y envio</p>
            <button onClick={() => setPedidoOk(false)} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>
              Seguir comprando
            </button>
          </div>
        </div>
      )}

      {checkout && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setCheckout(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} />
          <div style={{ position: "relative", background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 28, width: "90%", maxWidth: 400 }}>
            <h2 style={{ ...neon, fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Finalizar pedido</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{"Total: $" + totalP.toLocaleString("es-AR")}</p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre completo *</div>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Telefono *</div>
              <input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="Tu telefono"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Direccion de envio</div>
              <input value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Tu direccion"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <button onClick={confirmarPedido} disabled={enviando} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              {enviando ? "Enviando..." : "Confirmar pedido"}
            </button>
            <button onClick={() => setCheckout(false)} style={{ width: "100%", padding: 11, background: "transparent", border: "1px solid #333", borderRadius: 12, color: "#555", fontWeight: 700, cursor: "pointer" }}>
              Volver al carrito
            </button>
          </div>
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
                  {carrito.map(item => {
                    const esFlash = item.precio_oferta && item.oferta_hasta && new Date(item.oferta_hasta).getTime() > new Date().getTime();
                    const pItem = esFlash ? item.precio_oferta! : item.precio;
                    return (
                      <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #222" }}>
                        <span style={{ fontSize: 28 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{item.nombre}</div>
                          <div style={{ color: "#ff2d78", fontWeight: 800 }}>{"$" + (pItem * item.cantidad).toLocaleString("es-AR")}</div>
                          <div style={{ color: "#555", fontSize: 12 }}>{"x" + item.cantidad}</div>
                        </div>
                        <button onClick={() => quitar(item.id)} style={{ background: "none", border: "none", color: "#ff2d78", cursor: "pointer", fontSize: 16 }}>X</button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px solid #ff2d78", paddingTop: 16, marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ color: "#fff", fontWeight: 700 }}>Total</span>
                    <span style={{ color: "#ff2d78", fontSize: 20, fontWeight: 900 }}>{"$" + totalP.toLocaleString("es-AR")}</span>
                  </div>
                  <button onClick={() => setCheckout(true)} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
                    Finalizar compra
                  </button>
                  <button onClick={wa} style={{ width: "100%", padding: 11, background: "transparent", border: "1px solid #25D366", borderRadius: 12, color: "#25D366", fontWeight: 700, cursor: "pointer" }}>
                    Pedir por WhatsApp
                  </button>
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

      <section style={{ background: "linear-gradient(135deg, #1a0010 0%, #0a0a0a 50%, #1a0010 100%)", textAlign: "center", padding: "50px 20px", borderBottom: "1px solid #ff2d78" }}>
        <img
          src="https://acjufczrwyztsmzmljdk.supabase.co/storage/v1/object/public/productos/icono.ico.jpg"
          alt="CARITO.SHOP"
          style={{ width: 220, maxWidth: "80%", marginBottom: 16, borderRadius: 16, display: "block", margin: "0 auto 16px auto" }}
        />
        <p style={{ color: "#ccc", fontSize: 17, marginBottom: 0 }}>Envios a todo el pais - Paga con MercadoPago</p>
      </section>

      {/* BANNER DINÁMICO CORREGIDO */}
      {ofertaActiva && (
        <div style={{ background: "linear-gradient(90deg, #220011, #450a26, #220011)", borderBottom: "1px dashed #ff2d78", padding: "16px 20px", textAlign: "center" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <span style={{ background: "#ff2d78", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, verticalAlign: "middle", marginRight: 8 }}>OFERTA FLASH</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>¡{ofertaActiva.nombre} con súper descuento! ⚡</span>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
              {[{ v: tiempoRestante.dias, l: "d" }, { v: tiempoRestante.horas, l: "h" }, { v: tiempoRestante.minutes, l: "m" }, { v: tiempoRestante.segundos, l: "s" }].map((t, idx) => (
                <div key={idx} style={{ background: "#0a0a0a", border: "1px solid #ff2d78", borderRadius: 8, minWidth: 44, padding: "4px 6px", boxShadow: "0 0 5px rgba(255,45,120,0.3)" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>{String(t.v).padStart(2, "0")}</div>
                  <div style={{ color: "#555", fontSize: 9, textTransform: "uppercase", fontWeight: 700 }}>{t.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 0", display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{
            padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            background: categoriaActiva === cat ? "#ff2d78" : "#222",
            color: categoriaActiva === cat ? "#fff" : "#888",
            fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0,
            boxShadow: categoriaActiva === cat ? "0 0 10px rgba(255,45,120,0.5)" : "none",
          }}>
            {cat}
          </button>
        ))}
      </div>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 20px 50px" }}>
        <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20, ...neon }}>
          {categoriaActiva === "Todos" ? "Nuestros productos" : categoriaActiva}
        </h3>
        {cargando && <div style={{ textAlign: "center", color: "#ff2d78", padding: 60 }}>Cargando...</div>}
        {!cargando && listaFiltrada.length === 0 && (
          <div style={{ textAlign: "center", color: "#555", padding: 60 }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <div style={{ marginTop: 12 }}>No hay productos en esta categoria</div>
          </div>
        )}
        {!cargando && listaFiltrada.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {listaFiltrada.map(p => {
              const imagenes = getImagenes(p);
              const indice = indicesProducto[p.id] || 0;
              
              const esOfertaVigente = p.precio_oferta && p.oferta_hasta && new Date(p.oferta_hasta).getTime() > new Date().getTime();
              const precioMostrar = esOfertaVigente ? p.precio_oferta! : p.precio;

              return (
                <div key={p.id} style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, overflow: "hidden" }}>
                  {/* GALERIA DE IMAGENES */}
                  <div style={{ height: 220, position: "relative", background: "#0a0a0a", borderBottom: "1px solid #ff2d78" }}>
                    {imagenes.length > 0 ? (
                      <>
                        <img
                          src={imagenes[indice]}
                          alt={p.nombre}
                          onClick={() => setVisor({ imagenes, indice })}
                          style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "zoom-in" }}
                        />
                        {imagenes.length > 1 && (
                          <>
                            <button onClick={() => cambiarIndice(p.id, -1, imagenes.length)}
                              style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: 50, width: 32, height: 32 }}>‹</button>
                            <button onClick={() => cambiarIndice(p.id, 1, imagenes.length)}
                              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: 50, width: 32, height: 32 }}>›</button>
                            <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                              {imagenes.map((_, i) => (
                                <div key={i} onClick={() => setIndicesProducto(prev => ({ ...prev, [p.id]: i }))}
                                  style={{ width: 7, height: 7, borderRadius: 50, background: i === indice ? "#ff2d78" : "#555", cursor: "pointer" }} />
                              ))}
                            </div>
                          </>
                        )}
                        <div onClick={() => setVisor({ imagenes, indice })}
                          style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>
                          <span style={{ color: "#fff", fontSize: 14 }}>🔍</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70 }}>
                        {p.emoji}
                      </div>
                    )}
                    {/* CONDICIONAL DE STOCK CORREGIDO */}
                    {p.stock <= 3 && p.stock > 0 && (
                      <div style={{ position: "absolute", top: 8, left: 8, background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>
                        Ultimas {p.stock} unidades
                      </div>
                    )}
                    {esOfertaVigente && (
                      <div style={{ position: "absolute", bottom: 8, left: 8, background: "#ff2d78", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6, boxShadow: "0 0 10px #ff2d78" }}>
                        ⚡ OFERTA
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, color: "#ff2d78", fontWeight: 600, marginBottom: 4 }}>{p.categoria}</div>
                    <h4 style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{p.nombre}</h4>
                    <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>{p.descripcion}</p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#ff2d78" }}>
                          {"$" + precioMostrar.toLocaleString("es-AR")}
                        </span>
                        {esOfertaVigente && (
                          <span style={{ fontSize: 13, color: "#555", textDecoration: "line-through" }}>
                            {"$" + p.precio.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: "#555" }}>{"Stock: " + p.stock}</span>
                    </div>

                    <button onClick={() => agregar(p)} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
                      Agregar al carrito
                    </button>
                    <button onClick={() => {
                      const msg = "Hola CARITO.SHOP! Me interesa: " + p.nombre + " - $" + precioMostrar.toLocaleString("es-AR");
                      window.open("https://wa.me/5491133851488?text=" + encodeURIComponent(msg), "_blank");
                    }} style={{ width: "100%", padding: 10, background: "transparent", border: "1px solid #25D366", borderRadius: 12, color: "#25D366", fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                      💬 Consultar por WhatsApp
                    </button>
                    <button onClick={() => compartirProducto(p)} style={{ width: "100%", padding: 10, background: "transparent", border: "1px solid #fff", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                      📤 Compartir producto
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer style={{ textAlign: "center", padding: 28, borderTop: "1px solid #ff2d78", color: "#555", fontSize: 13 }}>
        2026 CARITO.SHOP - Hecho con amor en Argentina
      </footer>
    </main>
  );
}