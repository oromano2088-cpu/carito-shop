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
const inputStyle = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box" as const };

export default function AdminCompleto() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<'productos' | 'pedidos' | 'gastos'>('productos');

  // ESTADOS CONTABLES DE CAJAS DISPONIBLES
  const [cajas, setCajas] = useState({ alias: 0, brubankSenora: 0, efectivo: 0 });

  // ESTADOS GENERALES
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState("");

  // ESTADOS FORMULARIOS
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0" });
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [nuevoGasto, setNuevoGasto] = useState({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" });

  // FINANCIACIÓN
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [pedidoFinanciando, setPedidoFinanciando] = useState<number | null>(null);
  const [planCuotas, setPlanCuotas] = useState({ cantidad: 3, anticipo: 200000, recargoPorCuota: 10, cuenta: "Efectivo" });

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prodData) setProductos(prodData);
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) setListadoCategorias(catData);

    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    const listaPedidos = pData || [];
    setPedidos(listaPedidos);

    const { data: gData } = await supabase.from("gastos_distribuidoras").select("*").order("creado_en", { ascending: false });
    const listaGastos = gData || [];
    setGastos(listaGastos);

    const { data: rData } = await supabase.from("reporte_mensual").select("*");
    if (rData) setReportes(rData);

    // CALCULAR SALDOS CON EL NUEVO ALIAS DEL BRUBANK
    let totalAlias = 0;
    let totalBrubank = 0;
    let totalEfectivo = 0;

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

  const agregarCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    setNuevaCatNombre(""); cargarTodo();
  };
  const borrarCategoria = async (id: number) => { await supabase.from("categorias").delete().eq("id", id); cargarTodo(); };
  const subirFoto = async (file: File, campo: string) => {
    setSubiendo(true); const noble = Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(noble, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(noble);
    if (editando) setEditando(prev => prev ? { ...prev, [campo]: data.publicUrl } : null);
    else setNuevo(prev => ({ ...prev, [campo]: data.publicUrl }));
    setSubiendo(false); mostrarToast("Foto subida");
  };
  const agregar = async () => {
    await supabase.from("productos").insert({ nombre: nuevo.nombre, descripcion: nuevo.descripcion, precio: parseInt(nuevo.precio), precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null, oferta_hasta: nuevo.oferta_hasta ? nuevo.oferta_hasta : null, emoji: nuevo.emoji, imagen: nuevo.imagen, imagen2: nuevo.imagen2, imagen3: nuevo.imagen3, categoria: nuevo.categoria, stock: parseInt(nuevo.stock) || 0, activo: true });
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    cargarTodo();
  };
  const guardarEdicion = async () => {
    if (!editando) return;
    await supabase.from("productos").update({ nombre: editando.nombre, descripcion: editando.descripcion, precio: editando.precio, precio_oferta: editando.precio_oferta, oferta_hasta: editando.oferta_hasta, emoji: editando.emoji, imagen: editando.imagen, imagen2: editando.imagen2, imagen3: editando.imagen3, categoria: editando.categoria, stock: editando.stock }).eq("id", editando.id);
    setEditando(null); cargarTodo();
  };
  const toggleActivo = async (id: number, activo: boolean) => { await supabase.from("productos").update({ activo: !activo }).eq("id", id); cargarTodo(); };
  const eliminarProducto = async (id: number) => { await supabase.from("productos").delete().eq("id", id); cargarTodo(); };
  const actualizarStock = async (id: number, stockActual: number, cambio: number) => { await supabase.from("productos").update({ stock: Math.max(0, stockActual + cambio) }).eq("id", id); cargarTodo(); };

  const registrarGasto = async () => {
    if (!nuevoGasto.distribuidora || !nuevoGasto.monto) { mostrarToast("Completa distribuidora y monto"); return; }
    await supabase.from("gastos_distribuidoras").insert({
      distribuidora: nuevoGasto.distribuidora,
      monto: parseInt(nuevoGasto.monto),
      concepto: nuevoGasto.concepto,
      cuenta_salida: nuevoGasto.cuenta_salida
    });
    setNuevoGasto({ distribuidora: "", monto: "", concepto: "", cuenta_salida: "Efectivo" });
    mostrarToast("Compra registrada y caja descontada");
    cargarTodo();
  };

  const eliminarGasto = async (id: number) => {
    if (window.confirm("¿Anular este gasto? La caja se reajustará.")) {
      await supabase.from("gastos_distribuidoras").delete().eq("id", id);
      cargarTodo();
    }
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
    await supabase.from("pedidos").update({ approved: true, aprobado: true }).eq("id", pedido.id);
    mostrarToast("Stock descontado"); cargarTodo();
  };

  const cambiarEstadoPago = async (id: number, nuevoEstado: any) => {
    await supabase.from("pedidos").update({ estado_pago: nuevoEstado }).eq("id", id);
    cargarTodo();
  };

  const cambiarCuentaIngreso = async (id: number, nuevaCuenta: any) => {
    await supabase.from("pedidos").update({ cuenta_ingreso: nuevaCuenta }).eq("id", id);
    cargarTodo();
  };

  const cambiarEstadoEntrega = async (id: number, nuevoEstado: any) => {
    await supabase.from("pedidos").update({ estado_entrega: nuevoEstado }).eq("id", id);
    cargarTodo();
  };

  const aplicarFinanciacion = async (id: number, total: number) => {
    const valorCuota = Math.ceil((((total - planCuotas.anticipo) / (planCuotas.cantidad - 1)) * (1 + planCuotas.recargoPorCuota / 100)) / 1000) * 1000;
    await supabase.from("pedidos").update({
      es_financiado: true, anticipo: planCuotas.anticipo, cuotas_totales: planCuotas.cantidad,
      cuotas_pagadas: 1, monto_cuota: valorCuota, cuenta_ingreso: planCuotas.cuenta as any,
      total: planCuotas.anticipo + (valorCuota * (planCuotas.cantidad - 1))
    }).eq("id", id);
    setPedidoFinanciando(null); cargarTodo();
  };

  const pagarCuota = async (pedido: Pedido) => {
    const pagadas = (pedido.cuotas_pagadas || 0) + 1;
    const actualizar: any = { cuotas_pagadas: pagadas };
    if (pagadas >= (pedido.cuotas_totales || 3)) actualizar.estado_pago = 'pagado';
    await supabase.from("pedidos").update(actualizar).eq("id", pedido.id);
    cargarTodo();
  };

  const pedidosFiltrados = pedidos.filter(p => filtroMes === "Todos" ? true : p.creado_en.startsWith(filtroMes));

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 40, width: 320, textAlign: "center" }}>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Panel Admin</h2>
        <input type="password" placeholder="Clave secreta" value={clave} onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={{ ...inputStyle, marginBottom: 12, border: "1px solid #ff2d78" }} />
        {error && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={login} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Entrar</button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", padding: 20 }}>
      
      <div style={{ maxWidth: 1200, margin: "0 auto 30px auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 16 }}>
        <div>
          <h1 style={{ ...neon, fontSize: 24, fontWeight: 900, margin: 0 }}>CARITO.SHOP - ERP</h1>
          <p style={{ margin: "4px 0 0 0", color: "#555", fontSize: 13 }}>Control total de stock, compras a distribuidoras y cuentas</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPestana('productos')} style={{ padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", background: pestana === 'productos' ? "#ff2d78" : "#222", color: "#fff" }}>📦 Catálogo</button>
          <button onClick={() => setPestana('pedidos')} style={{ padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", background: pestana === 'pedidos' ? "#ff2d78" : "#222", color: "#fff" }}>📈 Ventas ({pedidos.filter(p=>!p.aprobado).length} o.)</button>
          <button onClick={() => setPestana('gastos')} style={{ padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", background: pestana === 'gastos' ? "#ff2d78" : "#222", color: "#fff" }}>💸 Compras Distribuidoras</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        
        <div>
          {/* 1. CATALOGO */}
          {pestana === 'productos' && (
            <div>
              <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 30 }}>
                <h2 style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>Gestionar Categorias</h2>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nueva categoria" style={inputStyle} />
                  <button onClick={agregarCategoria} style={{ padding: "10px 20px", background: "#ff2d78", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Añadir</button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {listadoCategorias.map(cat => <div key={cat.id} style={{ background: "#222", padding: "6px 12px", borderRadius: 20, color: "#fff", fontSize: 12 }}>{cat.Nombre} <button onClick={() => borrarCategoria(cat.id)} style={{ background: "none", border: "none", color: "#ff2d78", cursor: "pointer" }}>x</button></div>)}
                </div>
              </div>

              <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24 }}>
                <h2 style={{ color: "#fff", fontSize: 16, marginBottom: 16 }}>Agregar Producto Nuevo</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" style={inputStyle} />
                  <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="Precio" type="number" style={inputStyle} />
                </div>
                <button onClick={agregar} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Publicar producto</button>
              </div>
            </div>
          )}

          {/* 2. VENTAS */}
          {pestana === 'pedidos' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pedidosFiltrados.map(p => {
                const saldo = p.es_financiado ? ((p.cuotas_totales || 0) - (p.cuotas_pagadas || 0)) * (p.monto_cuota || 0) : (p.estado_pago === 'pendiente_pago' ? p.total : 0);
                return (
                  <div key={p.id} style={{ background: "#111", borderRadius: 16, padding: 20, border: p.aprobado ? "1px solid #222" : "2px solid #ff2d78" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{p.cliente_nombre}</h3>
                        <span style={{ fontSize: 11, color: "#666" }}>Destino caja: </span>
                        <select value={p.cuenta_ingreso} onChange={(e) => cambiarCuentaIngreso(p.id, e.target.value as any)} style={{ background: "#000", color: "#ff2d78", border: "1px solid #333", fontSize: 11, borderRadius: 4, padding: 2 }}>
                          <option value="Efectivo">💵 Efectivo</option>
                          <option value="Alias: carito.shop">📱 Alias: carito.shop</option>
                          <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora (DIARIO.ITALIA.ARENA)</option>
                        </select>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong>${p.total.toLocaleString("es-AR")}</strong>
                        <div style={{ fontSize: 11, color: saldo > 0 ? "#EF4444" : "#10B981" }}>{saldo > 0 ? `Debe $${saldo.toLocaleString("es-AR")}` : "Saldado"}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, background: "#000", padding: 8, borderRadius: 6, margin: "10px 0" }}>{p.productos}</p>
                    
                    {p.es_financiado && (
                      <div style={{ background: "rgba(255,45,120,0.04)", padding: 10, borderRadius: 6, marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span>Cuotas pagadas: {p.cuotas_pagadas}/{p.cuotas_totales} (${p.monto_cuota?.toLocaleString("es-AR")} c/u)</span>
                        {p.estado_pago !== 'pagado' && <button onClick={() => pagarCuota(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10 }}>+ Registrar Cuota</button>}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, borderTop: "1px solid #222", paddingTop: 10 }}>
                      {!p.aprobado && <button onClick={() => aprobarPedido(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Aprobar y Bajar Stock</button>}
                      <select value={p.estado_pago} onChange={(e) => cambiarEstadoPago(p.id, e.target.value as any)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, padding: 4 }}><option value="pendiente_pago">Debe</option><option value="pagado">Pagó Todo</option></select>
                      <select value={p.estado_entrega} onChange={(e) => cambiarEstadoEntrega(p.id, e.target.value as any)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, padding: 4 }}><option value="pendiente_entrega">No Entregado</option><option value="entregado">Entregado</option></select>
                      {!p.es_financiado && <button onClick={() => { setPedidoFinanciando(p.id); setPlanCuotas({ cantidad: 3, anticipo: Math.floor(p.total * 0.3), recargoPorCuota: 10, cuenta: p.cuenta_ingreso }); }} style={{ background: "transparent", color: "#ff2d78", border: "1px solid #ff2d78", borderRadius: 6, fontSize: 12, padding: "4px 8px", cursor: "pointer" }}>Financiar</button>}
                    </div>

                    {pedidoFinanciando === p.id && (
                      <div style={{ marginTop: 10, background: "#050505", padding: 10, borderRadius: 6, border: "1px dashed #ff2d78" }}>
                        <div style={{ display: "flex", gap: 6, fontSize: 11, marginBottom: 6 }}>
                          <label>Cuotas: <input type="number" value={planCuotas.cantidad} onChange={e=>setPlanCuotas(p=>({...p, cantidad:parseInt(e.target.value)||2}))} style={{width:40}}/></label>
                          <label>Anticipo $: <input type="number" value={planCuotas.anticipo} onChange={e=>setPlanCuotas(p=>({...p, anticipo:parseInt(e.target.value)||0}))} style={{width:80}}/></label>
                        </div>
                        <button onClick={() => aplicarFinanciacion(p.id, p.total)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Aplicar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. DISTRIBUIDORAS */}
          {pestana === 'gastos' && (
            <div>
              <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 20 }}>
                <h2 style={{ color: "#fff", fontSize: 16, margin: "0 0 16px 0" }}>Registrar Compra / Factura Proveedor</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <input value={nuevoGasto.distribuidora} onChange={e => setNuevoGasto(p => ({ ...p, distribuidora: e.target.value }))} placeholder="Nombre Distribuidora" style={inputStyle} />
                  <input value={nuevoGasto.monto} onChange={e => setNuevoGasto(p => ({ ...p, monto: e.target.value }))} placeholder="Monto ($)" type="number" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <input value={nuevoGasto.concepto} onChange={e => setNuevoGasto(p => ({ ...p, concepto: e.target.value }))} placeholder="Concepto (Ej: Lote de cocinas)" style={inputStyle} />
                  <select value={nuevoGasto.cuenta_salida} onChange={e => setNuevoGasto(p => ({ ...p, cuenta_salida: e.target.value as any }))} style={inputStyle}>
                    <option value="Efectivo">💸 Pagar con: Efectivo</option>
                    <option value="Alias: carito.shop">📱 Pagar con: Alias: carito.shop</option>
                    <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Pagar con: Brubank Señora</option>
                  </select>
                </div>
                <button onClick={registrarGasto} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #EF4444, #B91C1C)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Registrar Salida de Caja 📉</button>
              </div>

              <div style={{ background: "#111", borderRadius: 20, padding: 24 }}>
                <h2 style={{ color: "#fff", fontSize: 16, marginBottom: 16 }}>Historial de Gastos</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {gastos.map(g => (
                    <div key={g.id} style={{ background: "#0a0a0a", padding: 12, borderRadius: 10, border: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ color: "#fff", fontSize: 14 }}>{g.distribuidora}</strong>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{g.concepto} • <span style={{ color: "#EF4444" }}>{g.cuenta_salida}</span></div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ color: "#EF4444", fontWeight: 700 }}>-${g.monto.toLocaleString("es-AR")}</span>
                        <button onClick={() => eliminarGasto(g.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontWeight: 800 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL CONTABLE */}
        <div>
          <h2 style={{ fontSize: 18, margin: "0 0 16px 0", fontWeight: 800 }}>💰 Caja Disponible</h2>
          <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ borderBottom: "1px solid #222", paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#555" }}>💵 EFECTIVO FÍSICO</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: cajas.efectivo >= 0 ? "#10B981" : "#EF4444" }}>${cajas.efectivo.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ borderBottom: "1px solid #222", paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#555" }}>📱 ALIAS: carito.shop</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: cajas.alias >= 0 ? "#10B981" : "#EF4444" }}>${cajas.alias.toLocaleString("es-AR")}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#555" }}>👩 BRUBANK SEÑORA (DIARIO.ITALIA.ARENA)</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: cajas.brubankSenora >= 0 ? "#10B981" : "#EF4444" }}>${cajas.brubankSenora.toLocaleString("es-AR")}</div>
            </div>
          </div>

          <h2 style={{ fontSize: 18, margin: "0 0 16px 0", fontWeight: 800 }}>📊 Balance Mensual</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reportes.map((r, i) => (
              <div key={i} style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #222" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ff2d78", marginBottom: 6, borderBottom: "1px solid #222", paddingBottom: 4 }}>📅 Mes: {r.mes}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Ventas:</span><span>${r.ventas_totales.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Distribuidoras:</span><span style={{ color: "#EF4444" }}>-${r.total_gastos.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#10B981" }}>Cobros:</span><span style={{ color: "#10B981" }}>+${r.total_cobrado.toLocaleString("es-AR")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #222", paddingTop: 4 }}><span style={{ color: "#ff2d78", fontWeight: 700 }}>Ganancia Limpia:</span><strong style={{ color: "#ff2d78" }}>${r.ganancia_neta_real.toLocaleString("es-AR")}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#EF4444" }}>En la calle:</span><span style={{ color: "#EF4444" }}>${r.total_deuda.toLocaleString("es-AR")}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}