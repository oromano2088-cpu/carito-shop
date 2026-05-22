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
  productos: string; total: number; estado_pago: 'pendiente_pago' | 'pagado';
  estado_entrega: 'pendiente_entrega' | 'entregado'; aprobado: boolean; creado_en: string;
  es_financiado?: boolean; cuotas_totales?: number; cuotas_pagadas?: number; monto_cuota?: number;
  anticipo?: number; cuenta_ingreso: 'Alias: carito.shop' | 'Brubank Señora (DIARIO.ITALIA.ARENA)' | 'Efectivo';
};

type Gasto = {
  id: number; distribuidora: string; monto: number; concepto: string;
  cuenta_salida: 'Alias: carito.shop' | 'Brubank Señora (DIARIO.ITALIA.ARENA)' | 'Efectivo'; creado_en: string;
};

type Reporte = {
  mes: string; total_pedidos: number; total_cobrado: number; total_deuda: number;
  ventas_totales: number; total_gastos: number; ganancia_neta_real: number;
};

const CLAVE = "carito2026";
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };
const inputStyle = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #222", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" as const, outline: "none" };
const buttonStyle = { width: "100%", padding: 14, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" };

export default function AdminMobile() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  
  const [pestana, setPestana] = useState<'catalogo' | 'alta' | 'ventas' | 'caja'>('catalogo');

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
  const [nuevoGasto, setNuevoGasto] = useState({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" as any });

  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [pedidoFinanciando, setPedidoFinanciando] = useState<number | null>(null);
  const [planCuotas, setPlanCuotas] = useState({ cantidad: 3, anticipo: 200000, recargoPorCuota: 10, cuenta: "Efectivo" });
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prodData) setProductos(prodData);
    
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) {
      setListadoCategorias(catData);
      if (catData.length > 0 && !nuevo.categoria) {
        setNuevo(prev => ({ ...prev, categoria: catData[0].Nombre }));
      }
    }

    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    const listaPedidos = pData || []; setPedidos(listaPedidos);

    const meses = Array.from(new Set(listaPedidos.map(p => p.creado_en.substring(0, 7)))) as string[];
    setMesesDisponibles(meses);

    const { data: gData } = await supabase.from("gastos_distribuidoras").select("*").order("creado_en", { ascending: false });
    const listaGastos = gData || []; setGastos(listaGastos);

    const { data: rData } = await supabase.from("reporte_mensual").select("*");
    if (rData) setReportes(rData);

    let totalAlias = 0; let totalBrubank = 0; let totalEfectivo = 0;
    listaPedidos.forEach(p => {
      if (p.estado_pago === 'pagado') {
        if (p.cuenta_ingreso === 'Alias: carito.shop') totalAlias += p.total;
        if (p.cuenta_ingreso === 'Brubank Señora (DIARIO.ITALIA.ARENA)') totalBrubank += p.total;
        if (p.cuenta_ingreso === 'Efectivo') totalEfectivo += p.total;
      } else if (p.es_financiado && p.cuotas_pagadas && p.monto_cuota && p.anticipo) {
        const cobradoParcial = p.anticipo + ((p.cuotas_pagadas - 1) * p.monto_cuota);
        if (p.cuenta_ingreso === 'Alias: carito.shop') totalAlias += cobradoParcial;
        if (p.cuenta_ingreso === 'Brubank Señora (DIARIO.ITALIA.ARENA)') totalBrubank += cobradoParcial;
        if (p.cuenta_ingreso === 'Efectivo') totalEfectivo += cobradoParcial;
      }
    });
    listaGastos.forEach(g => {
      if (g.cuenta_salida === 'Alias: carito.shop') totalAlias -= g.monto;
      if (g.cuenta_salida === 'Brubank Señora (DIARIO.ITALIA.ARENA)') totalBrubank -= g.monto;
      if (g.cuenta_salida === 'Efectivo') totalEfectivo -= g.monto;
    });
    setCajas({ alias: totalAlias, brubankSenora: totalBrubank, efectivo: totalEfectivo });
    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const login = () => { if (clave === CLAVE) setLogueado(true); else setError("Clave incorrecta"); };

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    cargarTodo();
  };

  const actualizarStock = async (id: number, stockActual: number, cambio: number) => {
    const nuevoStock = Math.max(0, stockActual + cambio);
    await supabase.from("productos").update({ stock: nuevoStock }).eq("id", id);
    cargarTodo();
  };

  const handleSeleccionarCategoria = (valor: string) => {
    if (valor === "NUEVA") {
      setCreandoNuevaCat(true);
    } else {
      setCreandoNuevaCat(false);
      setNuevo(prev => ({ ...prev, categoria: valor }));
    }
  };

  const ejecutarCrearCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const { error } = await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    if (error) { mostrarToast("Ya existe esa categoria"); return; }
    mostrarToast("Categoría agregada");
    const nombreGuardado = nuevaCatNombre.trim();
    setNuevaCatNombre("");
    setCreandoNuevaCat(false);
    setNuevo(prev => ({ ...prev, categoria: nombreGuardado }));
    cargarTodo();
  };

  const subirFoto = async (file: File, campo: string) => {
    setSubiendo(true); const noble = Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(noble, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(noble);
    if (editando) {
      setEditando(prev => prev ? { ...prev, [campo]: data.publicUrl } : null);
    } else {
      setNuevo(prev => ({ ...prev, [campo]: data.publicUrl }));
    }
    setSubiendo(false); mostrarToast("Foto subida");
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completa nombre y precio"); return; }
    await supabase.from("productos").insert({ nombre: nuevo.nombre, descripcion: nuevo.descripcion, precio: parseInt(nuevo.precio), precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null, oferta_hasta: nuevo.oferta_hasta ? nuevo.oferta_hasta : null, emoji: nuevo.emoji, imagen: nuevo.imagen, imagen2: nuevo.imagen2, imagen3: nuevo.imagen3, categoria: nuevo.categoria, stock: parseInt(nuevo.stock) || 0, activo: true });
    mostrarToast("Producto publicado");
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    setPestana('catalogo');
    cargarTodo();
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    await supabase.from("productos").update({ 
      nombre: editando.nombre, 
      descripcion: editando.descripcion, 
      precio: editando.precio, 
      precio_oferta: editando.precio_oferta, 
      oferta_hasta: editando.oferta_hasta, 
      emoji: editando.emoji, 
      imagen: editando.imagen, 
      imagen2: editando.imagen2, 
      imagen3: editando.imagen3, 
      categoria: editando.categoria, 
      stock: editando.stock 
    }).eq("id", editando.id);
    setEditando(null); 
    mostrarToast("Producto actualizado");
    cargarTodo();
  };

  const registrarGasto = async () => {
    if (!nuevoGasto.distribuidora || !nuevoGasto.monto) { mostrarToast("Completa los datos"); return; }
    await supabase.from("gastos_distribuidoras").insert({ distribuidora: nuevoGasto.distribuidora, monto: parseInt(nuevoGasto.monto), concepto: nuevoGasto.concepto, cuenta_salida: nuevoGasto.cuenta_salida });
    setNuevoGasto({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" });
    mostrarToast("Gasto registrado"); cargarTodo();
  };

  const aprobarPedido = async (pedido: Pedido) => {
    if (pedido.aprobado) return;
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
    await supabase.from("pedidos").update({ aprobado: true }).eq("id", pedido.id);
    mostrarToast("Stock descontado"); cargarTodo();
  };

  const cambiarEstadoPago = async (id: number, nuevoEstado: any) => { await supabase.from("pedidos").update({ estado_pago: nuevoEstado }).eq("id", id); cargarTodo(); };
  const cambiarCuentaIngreso = async (id: number, nuevaCuenta: any) => { await supabase.from("pedidos").update({ cuenta_ingreso: nuevaCuenta }).eq("id", id); cargarTodo(); };
  const cambiarEstadoEntrega = async (id: number, nuevoEstado: any) => { await supabase.from("pedidos").update({ estado_entrega: nuevoEstado }).eq("id", id); cargarTodo(); };

  const aplicarFinanciacion = async (id: number, total: number) => {
    const valorCuota = Math.ceil((((total - planCuotas.anticipo) / (planCuotas.cantidad - 1)) * (1 + planCuotas.recargoPorCuota / 100)) / 1000) * 1000;
    await supabase.from("pedidos").update({ es_financiado: true, anticipo: planCuotas.anticipo, cuotas_totales: planCuotas.cantidad, cuotas_pagadas: 1, monto_cuota: valorCuota, cuenta_ingreso: planCuotas.cuenta as any, total: planCuotas.anticipo + (valorCuota * (planCuotas.cantidad - 1)) }).eq("id", id);
    setPedidoFinanciando(null); cargarTodo();
  };

  const pagarCuota = async (pedido: Pedido) => {
    const pagadas = (pedido.cuotas_pagadas || 0) + 1;
    const actualizar: any = { cuotas_pagadas: pagadas };
    if (pagadas >= (pedido.cuotas_totales || 3)) actualizar.estado_pago = 'pagado';
    await supabase.from("pedidos").update(actualizar).eq("id", pedido.id); cargarTodo();
  };

  const pedidosFiltrados = pedidos.filter(p => filtroMes === "Todos" ? true : p.creado_en.startsWith(filtroMes));

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

      {/* HEADER MOBILE COMPACTO */}
      <div style={{ padding: "8px 4px", borderBottom: "1px solid #222", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ ...neon, fontSize: 19, fontWeight: 900, margin: 0 }}>CARITO.SHOP - ERP</h1>
          <span style={{ color: "#555", fontSize: 11 }}>Panel de Control Móvil</span>
        </div>
        <a href="/" style={{ fontSize: 12, color: "#aaa", textDecoration: "none", border: "1px solid #333", padding: "4px 8px", borderRadius: 6 }}>Tienda 🛍️</a>
      </div>

      {/* SOLAPAS EN CUADRÍCULA MÓVIL */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
        <button onClick={() => setPestana('catalogo')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'catalogo' ? "#ff2d78" : "#111", color: "#fff" }}>📦 Ver Catálogo</button>
        <button onClick={() => setPestana('alta')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'alta' ? "#ff2d78" : "#111", color: "#fff" }}>✨ Alta Producto</button>
        <button onClick={() => setPestana('ventas')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'ventas' ? "#ff2d78" : "#111", color: "#fff" }}>📈 Ventas ({pedidos.filter(p=>!p.aprobado).length})</button>
        <button onClick={() => setPestana('caja')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'caja' ? "#ff2d78" : "#111", color: "#fff" }}>💰 Caja / Gastos</button>
      </div>

      {/* CONTENIDO DE CADA SOLAPA */}
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        
        {/* 1. SOLAPA CATÁLOGO */}
        {pestana === 'catalogo' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ fontSize: 16, margin: "4px 0" }}>Mis Productos ({productos.length})</h2>
            {productos.map(p => (
              <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #222" }}>
                <div style={{ width: 50, height: 50, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {p.imagen ? <img src={p.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>{p.emoji}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800, marginTop: 2 }}>{p.precio_oferta ? `$${p.precio_oferta.toLocaleString("es-AR")} ⚡` : `$${p.precio.toLocaleString("es-AR")}`}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <button onClick={() => actualizarStock(p.id, p.stock, -1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 22, height: 22, borderRadius: 4, fontWeight: 800 }}>-</button>
                    <span style={{ fontSize: 12, color: "#aaa" }}>Stock: {p.stock}</span>
                    <button onClick={() => actualizarStock(p.id, p.stock, 1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 22, height: 22, borderRadius: 4, fontWeight: 800 }}>+</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button onClick={() => setEditando(p)} style={{ padding: "4px 8px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Editar</button>
                  <button onClick={() => toggleActivo(p.id, p.activo)} style={{ padding: "4px 8px", background: p.activo ? "#10B981" : "#333", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{p.activo ? "On" : "Off"}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. SOLAPA ALTA DE PRODUCTO */}
        {pestana === 'alta' && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #ff2d78" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 16px 0", ...neon }}>Agregar Producto Nuevo</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del producto" style={inputStyle} />
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="Precio Normal ($)" type="number" style={inputStyle} />
              <textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción" rows={2} style={{ ...inputStyle, resize: "none" }} />
              
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Categoría</div>
                <select value={nuevo.categoria} onChange={e => handleSeleccionarCategoria(e.target.value)} style={inputStyle}>
                  {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                  <option value="NUEVA" style={{ color: "#ff2d78", fontWeight: "bold" }}>➕ [ CREAR NUEVA CATEGORÍA ]</option>
                </select>
              </div>

              {creandoNuevaCat && (
                <div style={{ background: "#0a0a0a", border: "1px dashed #ff2d78", padding: 12, borderRadius: 10, display: "flex", gap: 8 }}>
                  <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nombre" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={ejecutarCrearCategoria} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 8, padding: "0 12px", fontSize: 12, fontWeight: 700 }}>Guardar</button>
                </div>
              )}

              <input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="Stock Inicial" type="number" style={inputStyle} />
              <input value={nuevo.emoji} onChange={e => setNuevo(p => ({ ...p, emoji: e.target.value }))} placeholder="Emoji (🛍️)" style={inputStyle} />
              
              {["imagen", "imagen2", "imagen3"].map((campo, i) => (
                <div key={campo}>
                  <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>Foto {i+1} {i===0 ? "(Principal)" : "(Opcional)"}</div>
                  <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={{ ...inputStyle, fontSize: 12, color: "#aaa" }} />
                </div>
              ))}
              {subiendo && <div style={{ color: "#ff2d78", fontSize: 12, textAlign: "center" }}>Subiendo imagen...</div>}
              <button onClick={agregar} style={{ ...buttonStyle, marginTop: 8 }}>Publicar Producto</button>
            </div>
          </div>
        )}

        {/* 3. SOLAPA VENTAS */}
        {pestana === 'ventas' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Órdenes Recibidas</h2>
              <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: 6, borderRadius: 8, fontSize: 12 }}>
                <option value="Todos">Todos los meses</option>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {pedidosFiltrados.map(p => {
              const saldo = p.es_financiado ? ((p.cuotas_totales || 0) - (p.cuotas_pagadas || 0)) * (p.monto_cuota || 0) : (p.estado_pago === 'pendiente_pago' ? p.total : 0);
              return (
                <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 14, border: p.aprobado ? "1px solid #222" : "2px solid #ff2d78" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15 }}>{p.cliente_nombre}</h4>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Caja:</div>
                      <select value={p.cuenta_ingreso} onChange={(e) => cambiarCuentaIngreso(p.id, e.target.value as any)} style={{ background: "#000", color: "#ff2d78", border: "1px solid #222", fontSize: 11, padding: 3, borderRadius: 4 }}>
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Alias: carito.shop">📱 Alias: carito.shop</option>
                        <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                      </select>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>${p.total.toLocaleString("es-AR")}</span>
                      <div style={{ fontSize: 11, color: saldo > 0 ? "#EF4444" : "#10B981", fontWeight: 700 }}>{saldo > 0 ? `Debe $${saldo.toLocaleString("es-AR")}` : "Saldado"}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, background: "#000", padding: 6, borderRadius: 6, margin: "8px 0", color: "#bbb" }}>{p.productos}</p>

                  {p.es_financiado && (
                    <div style={{ background: "rgba(255,45,120,0.04)", padding: 8, borderRadius: 6, marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 11, alignItems: "center" }}>
                      <span>Cuotas: {p.cuotas_pagadas}/{p.cuotas_totales} (${p.monto_cuota?.toLocaleString("es-AR")} c/u)</span>
                      {p.estado_pago !== 'pagado' && <button onClick={() => pagarCuota(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 4, padding: "4px 6px", fontSize: 10 }}>+ Cuota</button>}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 4, borderTop: "1px solid #222", paddingTop: 8, flexWrap: "wrap" }}>
                    {!p.aprobado && <button onClick={() => aprobarPedido(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>✔️ Stock</button>}
                    <select value={p.estado_pago} onChange={(e) => cambiarEstadoPago(p.id, e.target.value as any)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, padding: 4 }}><option value="pendiente_pago">Debe</option><option value="pagado">Pagado</option></select>
                    <select value={p.estado_entrega} onChange={(e) => cambiarEstadoEntrega(p.id, e.target.value as any)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, padding: 4 }}><option value="pendiente_entrega">Falta</option><option value="entregado">Entregado</option></select>
                    {!p.es_financiado && <button onClick={() => { setPedidoFinanciando(p.id); setPlanCuotas({ cantidad: 3, anticipo: Math.floor(p.total * 0.3), recargoPorCuota: 10, cuenta: p.cuenta_ingreso }); }} style={{ background: "transparent", color: "#ff2d78", border: "1px solid #ff2d78", borderRadius: 6, fontSize: 11, padding: "2px 6px" }}>Financiar</button>}
                  </div>

                  {pedidoFinanciando === p.id && (
                    <div style={{ marginTop: 8, background: "#050505", padding: 8, borderRadius: 6, border: "1px dashed #ff2d78" }}>
                      <div style={{ display: "flex", gap: 4, fontSize: 11, marginBottom: 6 }}>
                        <label>Cuotas: <input type="number" value={planCuotas.cantidad} onChange={e=>setPlanCuotas(p=>({...p, cantidad:parseInt(e.target.value)||2}))} style={{width:30, background: "#111", color:"#fff", border:"1px solid #333"}}/></label>
                        <label>Anticipo: <input type="number" value={planCuotas.anticipo} onChange={e=>setPlanCuotas(p=>({...p, anticipo:parseInt(e.target.value)||0}))} style={{width:60, background: "#111", color:"#fff", border:"1px solid #333"}}/></label>
                      </div>
                      <button onClick={() => aplicarFinanciacion(p.id, p.total)} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 10 }}>Aplicar Plan</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 4. SOLAPA CAJA */}
        {pestana === 'caja' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 14 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px 0", color: "#ff2d78" }}>💰 Saldos en Caja Hoy</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: 4 }}><span>💵 Efectivo Físico:</span><strong style={{ color: "#10B981" }}>${cajas.efectivo.toLocaleString("es-AR")}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #222", paddingBottom: 4 }}><span>📱 Alias: carito.shop:</span><strong style={{ color: "#10B981" }}>${cajas.alias.toLocaleString("es-AR")}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>👩 Brubank Señora:</span><strong style={{ color: "#10B981" }}>${cajas.brubankSenora.toLocaleString("es-AR")}</strong></div>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: 16, padding: 14, border: "1px solid #333" }}>
              <h3 style={{ fontSize: 15, margin: "0 0 12px 0" }}>Registrar Gasto Distribuidora</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={nuevoGasto.distribuidora} onChange={e => setNuevoGasto(p => ({ ...p, distribuidora: e.target.value }))} placeholder="Distribuidora" style={inputStyle} />
                <input value={nuevoGasto.monto} onChange={e => setNuevoGasto(p => ({ ...p, monto: e.target.value }))} placeholder="Monto ($)" type="number" style={inputStyle} />
                <input value={nuevoGasto.concepto} onChange={e => setNuevoGasto(p => ({ ...p, concepto: e.target.value }))} placeholder="Concepto" style={inputStyle} />
                <select value={nuevoGasto.cuenta_salida} onChange={e => setNuevoGasto(p => ({ ...p, cuenta_salida: e.target.value as any }))} style={inputStyle}>
                  <option value="Efectivo">💸 Efectivo</option>
                  <option value="Alias: carito.shop">📱 Alias: carito.shop</option>
                  <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                </select>
                <button onClick={registrarGasto} style={{ ...buttonStyle, background: "linear-gradient(135deg, #EF4444, #B91C1C)" }}>Registrar Egreso</button>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: 16, padding: 14, border: "1px solid #333" }}>
              <h3 style={{ fontSize: 15, margin: "0 0 12px 0" }}>📊 Historial Mensual Neto</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reportes.map((r, i) => (
                  <div key={i} style={{ background: "#0a0a0a", padding: 12, borderRadius: 10, fontSize: 13, border: "1px solid #222" }}>
                    <div style={{ fontWeight: "bold", color: "#ff2d78", marginBottom: 4 }}>Mes: {r.mes}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{color:"#555"}}>Distribuidoras:</span><span style={{color:"#EF4444"}}>-${r.total_gastos.toLocaleString("es-AR")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{color:"#555"}}>Cobrado:</span><span style={{color:"#10B981"}}>+${r.total_cobrado.toLocaleString("es-AR")}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop:"1px dashed #222", marginTop:4, paddingTop:4 }}><span style={{fontWeight:700}}>Ganancia Neta:</span><strong style={{color:"#ff2d78"}}>${r.ganancia_neta_real.toLocaleString("es-AR")}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL EDITAR PRODUCTO COMPLETO ================= */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div onClick={() => setEditando(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 16, width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{ ...neon, margin: "0 0 16px 0" }}>Editar Producto</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Nombre</div>
                <input value={editando.nombre} onChange={e => setEditando(p => p ? { ...p, nombre: e.target.value } : null)} style={inputStyle} />
              </div>

              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Descripción</div>
                <textarea value={editando.descripcion} onChange={e => setEditando(p => p ? { ...p, descripcion: e.target.value } : null)} rows={2} style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Precio Normal ($)</div>
                  <input type="number" value={editando.precio} onChange={e => setEditando(p => p ? { ...p, precio: parseInt(e.target.value) } : null)} style={inputStyle} />
                </div>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Stock Actual</div>
                  <input type="number" value={editando.stock} onChange={e => setEditando(p => p ? { ...p, stock: parseInt(e.target.value) } : null)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ color: "#ff2d78", fontSize: 11, marginBottom: 4, fontWeight: "bold" }}>Precio Oferta</div>
                  <input type="number" value={editando.precio_oferta || ""} onChange={e => setEditando(p => p ? { ...p, precio_oferta: e.target.value ? parseInt(e.target.value) : null } : null)} style={inputStyle} />
                </div>
                <div>
                  <div style={{ color: "#ff2d78", fontSize: 11, marginBottom: 4, fontWeight: "bold" }}>Oferta Hasta</div>
                  <input type="datetime-local" value={editando.oferta_hasta ? editando.oferta_hasta.substring(0,16) : ""} onChange={e => setEditando(p => p ? { ...p, oferta_hasta: e.target.value ? e.target.value : null } : null)} style={inputStyle} />
                </div>
              </div>

              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Categoría</div>
                <select value={editando.categoria} onChange={e => setEditando(p => p ? { ...p, categoria: e.target.value } : null)} style={inputStyle}>
                  {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                </select>
              </div>

              {/* GESTIÓN DE IMÁGENES AL EDITAR */}
              <div style={{ marginTop: 10, borderTop: "1px solid #222", paddingTop: 10 }}>
                <div style={{ color: "#ff2d78", fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>📷 Fotos del Producto (Modificar / Cargar)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["imagen", "imagen2", "imagen3"].map((campo, i) => (
                    <div key={campo} style={{ background: "#0a0a0a", padding: 8, borderRadius: 10, border: "1px solid #222" }}>
                      <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>{"Foto " + (i + 1) + (i === 0 ? " (Principal)" : " (Opcional)")}</div>
                      {editando[campo as keyof Producto] && (
                        <img src={editando[campo as keyof Producto] as string} style={{ height: 60, borderRadius: 6, objectFit: "cover", marginBottom: 6, display: "block" }} />
                      )}
                      <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={{ ...inputStyle, padding: 6, fontSize: 11, color: "#aaa" }} />
                    </div>
                  ))}
                </div>
              </div>

              {subiendo && <div style={{ color: "#ff2d78", fontSize: 12, textAlign: "center", marginTop: 4 }}>Subiendo nueva imagen al servidor...</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={() => setEditando(null)} style={{ ...buttonStyle, background: "#222" }}>Cerrar</button>
                <button onClick={guardarEdicion} style={buttonStyle}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}