"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = { id: number; nombre: string; descripcion: string; precio: number; emoji: string; activo: boolean; imagen: string; };

const CLAVE = "carito2026";

export default function Admin() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", emoji: "🛍️", imagen: "" });
  const [toast, setToast] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => { if (logueado) cargar(); }, [logueado]);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from("productos").select("*");
    if (data) setProductos(data);
    setCargando(false);
  };

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const login = () => {
    if (clave === CLAVE) { setLogueado(true); setError(""); }
    else setError("Clave incorrecta");
  };

  const subirFoto = async (file: File) => {
    setSubiendo(true);
    const nombre = Date.now() + "-" + file.name;
    const { error } = await supabase.storage.from("productos").upload(nombre, file);
    if (error) { mostrarToast("Error al subir foto"); setSubiendo(false); return; }
    const { data } = supabase.storage.from("productos").getPublicUrl(nombre);
    setNuevo(prev => ({ ...prev, imagen: data.publicUrl }));
    setSubiendo(false);
    mostrarToast("Foto subida correctamente");
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completa nombre y precio"); return; }
    const { error } = await supabase.from("productos").insert({
      Nombre: nuevo.nombre,
      descripcion: nuevo.descripcion,
      precio: parseInt(nuevo.precio),
      emoji: nuevo.emoji,
      imagen: nuevo.imagen,
      activo: true,
    });
    if (error) { mostrarToast("Error al guardar"); return; }
    mostrarToast("Producto agregado");
    setNuevo({ nombre: "", descripcion: "", precio: "", emoji: "🛍️", imagen: "" });
    cargar();
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    cargar();
  };

  const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 40, width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Panel Admin</h2>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>CARITO.SHOP</p>
        <input
          type="password"
          placeholder="Ingresa tu clave secreta"
          value={clave}
          onChange={e => setClave(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #ff2d78", background: "#0a0a0a", color: "#fff", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
        />
        {error && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={login} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
          Entrar
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", padding: 20 }}>
      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h1 style={{ ...neon, fontSize: 24, fontWeight: 900 }}>Panel Admin</h1>
            <p style={{ color: "#555", fontSize: 13 }}>CARITO.SHOP</p>
          </div>
          <a href="/" style={{ color: "#ff2d78", fontSize: 13, textDecoration: "none" }}>Ver tienda</a>
        </div>
        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 30 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Agregar producto</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre</div>
              <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del producto"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Precio</div>
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))}
                placeholder="25000" type="number"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Descripcion</div>
            <textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripcion del producto" rows={2}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box", resize: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Emoji</div>
              <input value={nuevo.emoji} onChange={e => setNuevo(p => ({ ...p, emoji: e.target.value }))}
                placeholder="🛍️"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 20, boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Foto</div>
              <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0])}
                style={{ width: "100%", padding: 8, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#888", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>
          {nuevo.imagen && (
            <div style={{ marginBottom: 12 }}>
              <img src={nuevo.imagen} style={{ height: 100, borderRadius: 10, objectFit: "cover" }} />
              <div style={{ color: "#10B981", fontSize: 12, marginTop: 4 }}>Foto lista</div>
            </div>
          )}
          {subiendo && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>Subiendo foto...</div>}
          <button onClick={agregar} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            Publicar producto
          </button>
        </div>
        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>{"Mis productos (" + productos.length + ")"}</h2>
          {cargando && <div style={{ color: "#ff2d78", textAlign: "center", padding: 40 }}>Cargando...</div>}
          {productos.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #222" }}>
              <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.imagen ? <img src={p.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30 }}>{p.emoji}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                <div style={{ color: "#ff2d78", fontWeight: 800, fontSize: 15 }}>{"$" + p.precio.toLocaleString("es-AR")}</div>
              </div>
              <button onClick={() => toggleActivo(p.id, p.activo)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                background: p.activo ? "#10B981" : "#374151", color: "#fff",
              }}>
                {p.activo ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}