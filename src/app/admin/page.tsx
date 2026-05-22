"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = { 
  id: number; nombre: string; descripcion: string; precio: number; precio_oferta: number | null; 
  oferta_hasta: string | null; emoji: string; activo: boolean; imagen: string; imagen2: string; 
  imagen3: string; categoria: string; stock: number; 
};
type Categoria = { id: number; Nombre: string; };
type Pedido = {
  id: number; cliente_nombre: string; cliente_telefono: string; cliente_direccion: string;
  productos: string; total: number; estado_pago: string; estado_entrega: string; 
  aprobado: boolean; creado_en: string; es_financiado?: boolean; cuotas_totales?: number; 
  cuotas_pagadas?: number; monto_cuota?: number; anticipo?: number; cuenta_ingreso: string;
  es_dropshipping?: boolean;
};
type Gasto = {
  id: number; distribuidora: string; monto: number; concepto: string;
  cuenta_salida: string; creado_en: string;
};
type Reporte = {
  mes: string; total_pedidos: number; total_cobrado: number; total_deuda: number;
  ventas_totales: number; total_gastos: number; ganancia_neta_real: number;
};

const CLAVE = "carito2026";
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };
const inputStyle = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #222", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" as const, outline: "none" };
const buttonStyle = { width: "100%", padding: 14, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" } as const;

export default function AdminMobileCompleto() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<'catalogo' | 'alta' | 'ventas' | 'caja' | 'cargar_venta'>('catalogo');
  const [cajas, setCajas] = useState({ alias: 0, brubankSenora: 0, efectivo: 0 });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0" });
  const [creandoNuevaCat, setCreandoNuevaCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [nuevoGasto, setNuevoGasto] = useState({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" });
  const [ventaManual, setVentaManual] = useState({ cliente: "", telefono: "", direccion: "", productoId: "", tipoPago: "Efectivo", esDropshipping: false });
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [coincidenciasAlta, setCoincidenciasAlta] = useState<Producto[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prodData) setProductos(prodData);
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) {
      setListadoCategorias(catData);
      if (catData.length > 0 && !nuevo.categoria) setNuevo(prev => ({ ...prev, categoria: catData[0].Nombre }));
    }
    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    const listaPedidos = pData || [];
    setPedidos(listaPedidos);
    const meses = Array.from(new Set(listaPedidos.map((p: Pedido) => p.creado_en ? p.creado_en.substring(0, 7) : ""))) as string[];
    setMesesDisponibles(meses.filter(Boolean));
    const { data: gData } = await supabase.from("gastos_distribuidoras").select("*").order("creado_en", { ascending: false });
    const listaGastos = gData || [];
    setGastos(listaGastos);
    const { data: rData } = await supabase.from("reporte_mensual").select("*");
    if (rData) setReportes(rData);
    let totalAlias = 0; let totalBrubank = 0; let totalEfectivo = 0;
    listaPedidos.forEach((p: Pedido) => {
      if (p.estado_pago === 'pagado') {
        if (p.cuenta_ingreso === 'Alias: carito.shop') totalAlias += p.total;
        if (p.cuenta_ingreso === 'Brubank Señora (DIARIO.ITALIA.ARENA)') totalBrubank += p.total;
        if (p.cuenta_ingreso === 'Efectivo') totalEfectivo += p.total;
      }
    });
    listaGastos.forEach((g: Gasto) => {
      if (g.cuenta_salida === 'Alias: carito.shop') totalAlias -= g.monto;
      if (g.cuenta_salida === 'Brubank Señora (DIARIO.ITALIA.ARENA)') totalBrubank -= g.monto;
      if (g.cuenta_salida === 'Efectivo') totalEfectivo -= g.monto;
    });
    setCajas({ alias: totalAlias, brubankSenora: totalBrubank, efectivo: totalEfectivo });
    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const login = () => { if (clave === CLAVE) setLogueado(true); else setError("Clave incorrecta"); };
  const toggleActivo = async (id: number, activo: boolean) => { await supabase.from("productos").update({ activo: !activo }).eq("id", id); cargarTodo(); };
  const actualizarStock = async (id: number, stockActual: number, cambio: number) => { await supabase.from("productos").update({ stock: Math.max(0, stockActual + cambio) }).eq("id", id); cargarTodo(); };

  const handleCambioNombreAlta = (texto: string) => {
    setNuevo(prev => ({ ...prev, nombre: texto }));
    if (texto.trim().length < 2) { setCoincidenciasAlta([]); return; }
    setCoincidenciasAlta(productos.filter(p => p.nombre.toLowerCase().includes(texto.toLowerCase())));
  };

  const handleSeleccionarCategoria = (valor: string) => {
    if (valor === "NUEVA") setCreandoNuevaCat(true);
    else { setCreandoNuevaCat(false); setNuevo(prev => ({ ...prev, categoria: valor })); }
  };

  const ejecutarCrearCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const { error: catErr } = await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    if (catErr) { mostrarToast("Ya existe esa categoria"); return; }
    mostrarToast("Categoria agregada");
    setNuevo(prev => ({ ...prev, categoria: nuevaCatNombre.trim() }));
    setNuevaCatNombre(""); setCreandoNuevaCat(false); cargarTodo();
  };

  const subirFoto = async (file: File, campo: string) => {
    setSubiendo(true);
    const nombre = Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(nombre, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(nombre);
    if (editando) setEditando(prev => prev ? { ...prev, [campo]: data.publicUrl } : null);
    else setNuevo(prev => ({ ...prev, [campo]: data.publicUrl }));
    setSubiendo(false); mostrarToast("Foto subida");
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completa nombre y precio"); return; }
    await supabase.from("productos").insert({
      nombre: nuevo.nombre, descripcion: nuevo.descripcion, precio: parseInt(nuevo.precio),
      precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null,
      emoji: nuevo.emoji, imagen: nuevo.imagen, imagen2: nuevo.imagen2, imagen3: nuevo.imagen3,
      categoria: nuevo.categoria, stock: parseInt(nuevo.stock) || 0, activo: true,
    });
    mostrarToast("Producto publicado");
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    setCoincidenciasAlta([]); setPestana('catalogo'); cargarTodo();
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    await supabase.from("productos").update({
      nombre: editando.nombre, descripcion: editando.descripcion, precio: editando.precio,
      precio_oferta: editando.precio_oferta, emoji: editando.emoji, imagen: editando.imagen,
      imagen2: editando.imagen2, imagen3: editando.imagen3, categoria: editando.categoria, stock: editando.stock,
    }).eq("id", editando.id);
    setEditando(null); mostrarToast("Producto actualizado"); cargarTodo();
  };

  const registrarGasto = async () => {
    if (!nuevoGasto.distribuidora || !nuevoGasto.monto) { mostrarToast("Completa los datos"); return; }
    await supabase.from("gastos_distribuidoras").insert({
      distribuidora: nuevoGasto.distribuidora, monto: parseInt(nuevoGasto.monto),
      concepto: nuevoGasto.concepto, cuenta_salida: nuevoGasto.cuenta_salida,
    });
    setNuevoGasto({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" });
    mostrarToast("Gasto registrado"); cargarTodo();
  };

  const cambiarEstadoPago = async (id: number, nuevoEstado: string) => { await supabase.from("pedidos").update({ estado_pago: nuevoEstado }).eq("id", id); cargarTodo(); };
  const cambiarCuentaIngreso = async (id: number, nuevaCuenta: string) => { await supabase.from("pedidos").update({ cuenta_ingreso: nuevaCuenta }).eq("id", id); cargarTodo(); };
  const cambiarEstadoEntrega = async (id: number, nuevoEstado: string) => { await supabase.from("pedidos").update({ estado_entrega: nuevoEstado }).eq("id", id); cargarTodo(); };

  const pagarCuota = async (pedido: Pedido) => {
    const pagadas = (pedido.cuotas_pagadas || 0) + 1;
    const actualizar: any = { cuotas_pagadas: pagadas };
    if (pagadas >= (pedido.cuotas_totales || 3)) actualizar.estado_pago = 'pagado';
    await supabase.from("pedidos").update(actualizar).eq("id", pedido.id);
    mostrarToast("Cuota cobrada"); cargarTodo();
  };

  const ejecutarCargaVentaManual = async () => {
    if (!ventaManual.cliente || !ventaManual.productoId) { mostrarToast("Asigna cliente y producto"); return; }
    const prodSeleccionado = productos.find(p => p.id === parseInt(ventaManual.productoId));
    if (!prodSeleccionado) return;
    const precioBase = prodSeleccionado.precio_oferta || prodSeleccionado.precio;
    let totalCalculado = precioBase;
    let esFinanciado = false;
    let cuotasTotales = 1;
    let cuotasPagadas = 1;
    let montoCuota = 0;
    let anticipoCalculado = precioBase;
    let cuentaAsignada = ventaManual.tipoPago === 'Cuotas' ? 'Efectivo' : ventaManual.tipoPago;
    if (ventaManual.tipoPago === "Cuotas") {
      esFinanciado = true; cuotasTotales = 3; cuotasPagadas = 1;
      const c1Base = precioBase / 3;
      anticipoCalculado = Math.ceil(c1Base / 1000) * 1000;
      montoCuota = Math.ceil((c1Base * 1.10) / 1000) * 1000;
      totalCalculado = anticipoCalculado + (montoCuota * 2);
    }
    await supabase.from("pedidos").insert({
      cliente_nombre: ventaManual.cliente, cliente_telefono: ventaManual.telefono,
      cliente_direccion: ventaManual.direccion, productos: prodSeleccionado.nombre + " x1",
      total: totalCalculado, estado_pago: esFinanciado ? 'pendiente_pago' : 'pagado',
      estado_entrega: 'pendiente_entrega', aprobado: false, es_financiado: esFinanciado,
      cuotas_totales: cuotasTotales, cuotas_pagadas: cuotasPagadas, monto_cuota: montoCuota,
      anticipo: anticipoCalculado, cuenta_ingreso: cuentaAsignada, es_dropshipping: ventaManual.esDropshipping,
    });
    mostrarToast("Venta registrada");
    setVentaManual({ cliente: "", telefono: "", direccion: "", productoId: "", tipoPago: "Efectivo", esDropshipping: false });
    setPestana('ventas'); cargarTodo();
  };

  const aprobarPedido = async (pedido: Pedido) => {
    if (pedido.aprobado) return;
    if (!pedido.es_dropshipping) {
      const items = pedido.productos.split(", ");
      for (const item of items) {
        const partes = item.split(" x");
        if (partes.length === 2) {
          const nombreProducto = partes[0].trim();
          const cantidadRestar = parseInt(partes[1]);
          const { data: prod } = await supabase.from("productos").select("id, stock").eq("nombre", nombreProducto).single();
          if (prod) await supabase.from("productos").update({ stock: Math.max(0, prod.stock - cantidadRestar) }).eq("id", prod.id);
        }
      }
    }
    await supabase.from("pedidos").update({ aprobado: true }).eq("id", pedido.id);
    mostrarToast(pedido.es_dropshipping ? "Dropshipping Confirmado" : "Stock descontado");
    cargarTodo();
  };

  const pedidosFiltrados = pedidos.filter(p => filtroMes === "Todos" ? true : p.creado_en && p.creado_en.startsWith(filtroMes));
  const pedidosActivos = pedidosFiltrados.filter(p => !(p.aprobado && p.estado_pago === 'pagado' && p.estado_entrega === 'entregado'));
  const productosFiltrados = productos.filter(p => busquedaCatalogo.trim() === "" ? true : p.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) || p.categoria.toLowerCase().includes(busquedaCatalogo.toLowerCase()));

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 30, width: "100%", maxWidth: 320, textAlign: "center" }}>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Panel Admin</h2>
        <input type="password" placeholder="Clave secreta" value={clave} onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={{ ...inputStyle, marginBottom: 12, border: "1px solid #ff2d78", textAlign: "center" }} />
        {error && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={login} style={buttonStyle}>Entrar</button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", color: "#fff", padding: "12px 12px 60px 12px", boxSizing: "border-box" }}>

      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, zIndex: 9999, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ padding: "8px 4px", borderBottom: "1px solid #222", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ ...neon, fontSize: 19, fontWeight: 900, margin: 0 }}>CARITO.SHOP - Admin</h1>
          <span style={{ color: "#555", fontSize: 11 }}>Panel de Control</span>
        </div>
        <a href="/" style={{ color: "#ff2d78", fontSize: 12, textDecoration: "none" }}>Ver tienda</a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button onClick={() => setPestana('catalogo')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'catalogo' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📦 Catalogo</button>
          <button onClick={() => setPestana('alta')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'alta' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>✨ Nuevo Producto</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <button onClick={() => setPestana('cargar_venta')} style={{ padding: 12, borderRadius: 10, border: "1px dashed #ff2d78", fontWeight: 800, fontSize: 11, background: pestana === 'cargar_venta' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📝 Cargar Venta</button>
          <button onClick={() => setPestana('ventas')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === 'ventas' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>{"📈 Ordenes (" + pedidosActivos.length + ")"}</button>
          <button onClick={() => setPestana('caja')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === 'caja' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>💰 Caja</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {pestana === 'cargar_venta' && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px dashed #ff2d78" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 16px 0", ...neon }}>Registrar Venta Manual</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Nombre del Cliente</div>
                <input value={ventaManual.cliente} onChange={e => setVentaManual(p => ({ ...p, cliente: e.target.value }))} placeholder="Nombre y Apellido" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Telefono</div>
                  <input value={ventaManual.telefono} onChange={e => setVentaManual(p => ({ ...p, telefono: e.target.value }))} placeholder="Celular" style={inputStyle} />
                </div>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Direccion</div>
                  <input value={ventaManual.direccion} onChange={e => setVentaManual(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle y Nro" style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Producto</div>
                <select value={ventaManual.productoId} onChange={e => setVentaManual(p => ({ ...p, productoId: e.target.value }))} style={inputStyle}>
                  <option value="">-- Elegí un producto --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre + " ($" + (p.precio_oferta || p.precio).toLocaleString("es-AR") + " - Stock: " + p.stock + ")"}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0a0a0a", padding: 12, borderRadius: 10, border: "1px solid #222" }}>
                <input type="checkbox" id="drop" checked={ventaManual.esDropshipping} onChange={e => setVentaManual(p => ({ ...p, esDropshipping: e.target.checked }))} style={{ transform: "scale(1.3)" }} />
                <label htmlFor="drop" style={{ fontSize: 13, color: "#ccc" }}>Es Dropshipping (sin descontar stock propio)</label>
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Forma de Pago</div>
                <select value={ventaManual.tipoPago} onChange={e => setVentaManual(p => ({ ...p, tipoPago: e.target.value }))} style={inputStyle}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Alias: carito.shop">Transferencia: Alias carito.shop</option>
                  <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">Transferencia: Brubank Señora</option>
                  <option value="Cuotas">Financiar en 3 Cuotas</option>
                </select>
              </div>
              <button onClick={ejecutarCargaVentaManual} style={buttonStyle}>Registrar Venta</button>
            </div>
          </div>
        )}

        {pestana === 'catalogo' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="text" value={busquedaCatalogo} onChange={e => setBusquedaCatalogo(e.target.value)} placeholder="Buscar producto..." style={inputStyle} />
            {productosFiltrados.map((p: Producto) => (
              <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #222" }}>
                <div style={{ width: 45, height: 45, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {p.imagen ? <img src={p.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>{p.emoji}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800 }}>{"$" + (p.precio_oferta || p.precio).toLocaleString("es-AR")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <button onClick={() => actualizarStock(p.id, p.stock, -1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>-</button>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{"Stock: " + p.stock}</span>
                    <button onClick={() => actualizarStock(p.id, p.stock, 1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>+</button>
                    <button onClick={() => toggleActivo(p.id, p.activo)} style={{ padding: "2px 8px", background: p.activo ? "#10B981" : "#374151", border: "none", color: "#fff", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                </div>
                <button onClick={() => setEditando(p)} style={{ padding: "6px 10px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Editar</button>
              </div>
            ))}
          </div>
        )}

        {pestana === 'alta' && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #ff2d78" }}>
            <h2 style={{ ...neon, fontSize: 16, margin: "0 0 16px 0" }}>Nuevo Producto</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={nuevo.nombre} onChange={e => handleCambioNombreAlta(e.target.value)} placeholder="Nombre del producto" style={inputStyle} />
              {coincidenciasAlta.length > 0 && (
                <div style={{ background: "#1c0510", padding: 8, borderRadius: 10, fontSize: 12, color: "#ff2d78" }}>
                  Ya existen similares: {coincidenciasAlta.map(c => c.nombre).join(" | ")}
                </div>
              )}
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="Precio" type="number" style={inputStyle} />
              <textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripcion" rows={2} style={inputStyle} />
              <select value={nuevo.categoria} onChange={e => handleSeleccionarCategoria(e.target.value)} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                <option value="NUEVA">+ Crear nueva categoria</option>
              </select>
              {creandoNuevaCat && (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nombre categoria" style={inputStyle} />
                  <button onClick={ejecutarCrearCategoria} style={{ background: "#10B981", border: "none", color: "#fff", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ok</button>
                </div>
              )}
              <input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="Stock inicial" type="number" style={inputStyle} />
              {["imagen", "imagen2", "imagen3"].map((campo, i) => (
                <div key={campo}>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>{"Foto " + (i + 1) + (i === 0 ? " (principal)" : " (opcional)")}</div>
                  <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={inputStyle} />
                </div>
              ))}
              {subiendo && <div style={{ color: "#ff2d78", fontSize: 13 }}>Subiendo foto...</div>}
              <button onClick={agregar} style={buttonStyle}>Publicar Producto</button>
            </div>
          </div>
        )}

        {pestana === 'ventas' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Ordenes Activas</h2>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: 6, borderRadius: 8, fontSize: 12 }}>
                <option value="Todos">Todos</option>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {pedidosActivos.map((p: Pedido) => {
              const saldo = p.es_financiado ? ((p.cuotas_totales || 0) - (p.cuotas_pagadas || 0)) * (p.monto_cuota || 0) : (p.estado_pago === 'pendiente_pago' ? p.total : 0);
              return (
                <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 14, border: p.aprobado ? "1px solid #222" : "2px solid #ff2d78" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14 }}>
                        {p.cliente_nombre}
                        {p.es_dropshipping && <span style={{ fontSize: 10, background: "#7C3AED", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>Drop</span>}
                      </h4>
                      <select value={p.cuenta_ingreso} onChange={e => cambiarCuentaIngreso(p.id, e.target.value)} style={{ background: "#000", color: "#ff2d78", fontSize: 11, padding: 3, marginTop: 4, borderRadius: 4, border: "1px solid #333" }}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Alias: carito.shop">Alias: carito.shop</option>
                        <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">Brubank Señora</option>
                      </select>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{"$" + p.total.toLocaleString("es-AR")}</span>
                      <div style={{ fontSize: 11, color: saldo > 0 ? "#EF4444" : "#10B981" }}>
                        {saldo > 0 ? "Debe $" + saldo.toLocaleString("es-AR") : "Saldado"}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, background: "#000", padding: 6, borderRadius: 6, margin: "8px 0" }}>{p.productos}</p>
                  {p.es_financiado && (
                    <div style={{ background: "rgba(255,45,120,0.04)", padding: 8, borderRadius: 6, marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span>{"Cuotas: " + p.cuotas_pagadas + "/" + p.cuotas_totales + " ($" + (p.monto_cuota || 0).toLocaleString("es-AR") + " c/u)"}</span>
                      {p.estado_pago !== 'pagado' && (
                        <button onClick={() => pagarCuota(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer" }}>
                          + Cobrar Cuota
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, borderTop: "1px solid #222", paddingTop: 8, flexWrap: "wrap" }}>
                    {!p.aprobado && (
                      <button onClick={() => aprobarPedido(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                        Confirmar
                      </button>
                    )}
                    <select value={p.estado_pago} onChange={e => cambiarEstadoPago(p.id, e.target.value)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, padding: 4 }}>
                      <option value="pendiente_pago">Debe</option>
                      <option value="pagado">Pago Total</option>
                    </select>
                    <select value={p.estado_entrega} onChange={e => cambiarEstadoEntrega(p.id, e.target.value)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, padding: 4 }}>
                      <option value="pendiente_entrega">Pendiente entrega</option>
                      <option value="entregado">Entregado</option>
                    </select>
                  </div>
                </div>
              );
            })}
            {pedidosActivos.length === 0 && (
              <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 20 }}>No hay ordenes activas</div>
            )}
          </div>
        )}

        {pestana === 'caja' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 14 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px 0", color: "#ff2d78" }}>Saldos Disponibles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: 6 }}>
                  <span>Efectivo:</span>
                  <strong>{"$" + cajas.efectivo.toLocaleString("es-AR")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: 6 }}>
                  <span>Alias carito.shop:</span>
                  <strong>{"$" + cajas.alias.toLocaleString("es-AR")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Brubank Señora:</span>
                  <strong>{"$" + cajas.brubankSenora.toLocaleString("es-AR")}</strong>
                </div>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: 16, padding: 14, border: "1px solid #333" }}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px 0" }}>Registrar Gasto</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={nuevoGasto.distribuidora} onChange={e => setNuevoGasto(p => ({ ...p, distribuidora: e.target.value }))} placeholder="Distribuidora / Proveedor" style={inputStyle} />
                <input value={nuevoGasto.monto} onChange={e => setNuevoGasto(p => ({ ...p, monto: e.target.value }))} placeholder="Monto" type="number" style={inputStyle} />
                <input value={nuevoGasto.concepto} onChange={e => setNuevoGasto(p => ({ ...p, concepto: e.target.value }))} placeholder="Concepto" style={inputStyle} />
                <select value={nuevoGasto.cuenta_salida} onChange={e => setNuevoGasto(p => ({ ...p, cuenta_salida: e.target.value }))} style={inputStyle}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Alias: carito.shop">Alias: carito.shop</option>
                  <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">Brubank Señora</option>
                </select>
                <button onClick={registrarGasto} style={{ ...buttonStyle, background: "linear-gradient(135deg, #EF4444, #B91C1C)" }}>Registrar Gasto</button>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: 16, padding: 14, border: "1px solid #333" }}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px 0" }}>Reportes Mensuales</h3>
              {reportes.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center" }}>Sin reportes aun</div>}
              {reportes.map((r, i) => (
                <div key={i} style={{ background: "#0a0a0a", padding: 12, borderRadius: 10, fontSize: 13, border: "1px solid #222", marginBottom: 10 }}>
                  <div style={{ fontWeight: "bold", color: "#ff2d78", marginBottom: 6 }}>{r.mes}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Ventas:</span><span>{"$" + r.ventas_totales.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Gastos:</span><span style={{ color: "#EF4444" }}>{"- $" + r.total_gastos.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Cobrado:</span><span style={{ color: "#10B981" }}>{"$" + r.total_cobrado.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #222", marginTop: 6, paddingTop: 6 }}>
                    <span style={{ fontWeight: 700 }}>Ganancia Neta:</span>
                    <strong style={{ color: "#ff2d78" }}>{"$" + r.ganancia_neta_real.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {editando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div onClick={() => setEditando(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 16, width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{ ...neon, margin: "0 0 16px 0" }}>Editar Producto</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={editando.nombre} onChange={e => setEditando(p => p ? { ...p, nombre: e.target.value } : null)} placeholder="Nombre" style={inputStyle} />
              <textarea value={editando.descripcion} onChange={e => setEditando(p => p ? { ...p, descripcion: e.target.value } : null)} rows={2} placeholder="Descripcion" style={inputStyle} />
              <input type="number" value={editando.precio} onChange={e => setEditando(p => p ? { ...p, precio: parseInt(e.target.value) } : null)} placeholder="Precio" style={inputStyle} />
              <input type="number" value={editando.stock} onChange={e => setEditando(p => p ? { ...p, stock: parseInt(e.target.value) } : null)} placeholder="Stock" style={inputStyle} />
              {["imagen", "imagen2", "imagen3"].map((campo, i) => (
                <div key={campo}>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>{"Foto " + (i + 1)}</div>
                  <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button onClick={() => setEditando(null)} style={{ ...buttonStyle, background: "#222" }}>Cancelar</button>
                <button onClick={guardarEdicion} style={buttonStyle}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}