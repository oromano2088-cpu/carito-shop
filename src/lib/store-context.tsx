"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Product, Order, OrderStatus, Customer, Coupon, CartLine, TargetedOffer, AIReport } from "./types";
import { seedProducts, seedCustomers, seedOrders, seedCoupons } from "./seed-data";
import { uid, formatMoney } from "./utils";
import { supabase, supabaseEnabled } from "./supabase";
import {
  rowToProduct, productToRow,
  rowToCustomer, customerToRow,
  rowToOrder, orderToRow,
  rowToCoupon, couponToRow,
  rowToOffer, offerToRow,
  rowToReport, reportToRow,
} from "./db-mappers";

const CART_KEY = "carito_cart_v1";
const DEVICE_KEY = "carito_device_id";
const IDENTITY_KEY = "carito_identity_v1";

interface EngagementEntry {
  productId: string;
  liked: boolean;
  saved: boolean;
}

export interface Identity {
  id: string;
  nombre: string;
  telefono: string;
}

interface AppState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  cart: CartLine[];
  offers: TargetedOffer[];
  reports: AIReport[];
  engagement: EngagementEntry[];
}

function emptyState(): AppState {
  return { products: [], orders: [], customers: [], coupons: [], cart: [], offers: [], reports: [], engagement: [] };
}

function seedState(): AppState {
  return {
    products: seedProducts,
    orders: seedOrders,
    customers: seedCustomers,
    coupons: seedCoupons,
    cart: [],
    offers: [],
    reports: [],
    engagement: [],
  };
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `dev_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function loadAll(deviceId: string): Promise<AppState> {
  if (!supabaseEnabled || !supabase) {
    return seedState();
  }
  try {
    const [productsRes, customersRes, ordersRes, couponsRes, offersRes, reportsRes, engagementRes] = await Promise.all([
      supabase.from("products").select("*").order("creado_en", { ascending: false }),
      supabase.from("customers").select("*"),
      supabase.from("orders").select("*").order("creado_en", { ascending: false }),
      supabase.from("coupons").select("*"),
      supabase.from("offers").select("*").order("creado_en", { ascending: false }),
      supabase.from("reports").select("*").order("generado_en", { ascending: false }),
      supabase.from("engagement").select("*").eq("device_id", deviceId),
    ]);

    return {
      products: productsRes.error || !productsRes.data?.length ? seedProducts : productsRes.data.map(rowToProduct),
      customers: customersRes.error ? seedCustomers : (customersRes.data ?? []).map(rowToCustomer),
      orders: ordersRes.error ? seedOrders : (ordersRes.data ?? []).map(rowToOrder),
      coupons: couponsRes.error ? seedCoupons : (couponsRes.data ?? []).map(rowToCoupon),
      offers: offersRes.error ? [] : (offersRes.data ?? []).map(rowToOffer),
      reports: reportsRes.error ? [] : (reportsRes.data ?? []).map(rowToReport),
      engagement: engagementRes.error
        ? []
        : (engagementRes.data ?? []).map((e: { product_id: string; liked: boolean; saved: boolean }) => ({
            productId: e.product_id,
            liked: e.liked,
            saved: e.saved,
          })),
      cart: [],
    };
  } catch (err) {
    console.error("No se pudo conectar con Supabase, usando datos de ejemplo.", err);
    return seedState();
  }
}

interface AppContextValue extends AppState {
  hydrated: boolean;
  dbConnected: boolean;
  addToCart: (productId: string, varianteId: string | undefined, cantidad?: number) => void;
  removeFromCart: (productId: string, varianteId?: string) => void;
  setCartQty: (productId: string, varianteId: string | undefined, cantidad: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  toggleLike: (productId: string) => void;
  toggleSave: (productId: string) => void;
  isLiked: (productId: string) => boolean;
  isSaved: (productId: string) => boolean;
  registerView: (productId: string) => void;
  registerShare: (productId: string) => void;
  identity: Identity | null;
  identityModalOpen: boolean;
  requestIdentity: (onDone?: () => void) => void;
  closeIdentityModal: () => void;
  identify: (nombre: string, telefono: string) => void;
  checkout: (data: {
    nombre: string;
    telefono: string;
    email?: string;
    entrega: "envio" | "retiro";
    direccion?: string;
    metodoPago: "mercadopago" | "transferencia" | "efectivo";
    cuponCodigo?: string;
  }) => Order;
  addProduct: (p: Omit<Product, "id" | "vendidos" | "creadoEn" | "likes" | "guardados" | "compartidos" | "vistas">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addCoupon: (c: Omit<Coupon, "id" | "usosActuales">) => void;
  registerDebtPayment: (customerId: string, monto: number) => void;
  generateTargetedOffers: () => TargetedOffer[];
  updateOfferStatus: (offerId: string, estado: TargetedOffer["estado"]) => void;
  generateAIReport: () => AIReport;
}

const AppContext = createContext<AppContextValue | null>(null);

function warn(action: string, error: unknown) {
  console.error(`[CARITO.SHOP] No se pudo sincronizar "${action}" con la base de datos:`, error);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const deviceIdRef = useRef<string>("server");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const deviceId = getDeviceId();
    deviceIdRef.current = deviceId;
    (async () => {
      try {
        const rawIdentity = localStorage.getItem(IDENTITY_KEY);
        if (rawIdentity) {
          const parsed = JSON.parse(rawIdentity) as Identity;
          identityRef.current = parsed;
          setIdentity(parsed);
        }
      } catch {}
      const loaded = await loadAll(deviceId);
      try {
        const rawCart = localStorage.getItem(CART_KEY);
        if (rawCart) loaded.cart = JSON.parse(rawCart);
      } catch {}
      setState(loaded);
      setHydrated(true);
    })();
  }, []);

  const requestIdentity = useCallback((onDone?: () => void) => {
    pendingActionRef.current = onDone ?? null;
    setIdentityModalOpen(true);
  }, []);

  const closeIdentityModal = useCallback(() => {
    pendingActionRef.current = null;
    setIdentityModalOpen(false);
  }, []);

  const identify = useCallback((nombre: string, telefono: string) => {
    const cleanNombre = nombre.trim();
    const cleanTelefono = telefono.trim();
    const outcome: { identity?: Identity; customer?: Customer } = {};
    setState((s) => {
      const currentLiked = s.engagement.filter((e) => e.liked).map((e) => e.productId);
      const currentSaved = s.engagement.filter((e) => e.saved).map((e) => e.productId);
      const existing = s.customers.find((c) => c.telefono === cleanTelefono);
      let customers: Customer[];
      if (existing) {
        const updated: Customer = {
          ...existing,
          nombre: cleanNombre || existing.nombre,
          productosLikeados: [...new Set([...existing.productosLikeados, ...currentLiked])],
          productosGuardados: [...new Set([...existing.productosGuardados, ...currentSaved])],
          scoreInteres: Math.min(100, existing.scoreInteres + 5),
        };
        outcome.customer = updated;
        outcome.identity = { id: updated.id, nombre: updated.nombre, telefono: updated.telefono };
        customers = s.customers.map((c) => (c.id === existing.id ? updated : c));
      } else {
        const nuevo: Customer = {
          id: uid("c"),
          nombre: cleanNombre,
          telefono: cleanTelefono,
          totalComprado: 0,
          cantidadPedidos: 0,
          deuda: 0,
          esRecurrente: false,
          productosLikeados: currentLiked,
          productosGuardados: currentSaved,
          scoreInteres: 30,
        };
        outcome.customer = nuevo;
        outcome.identity = { id: nuevo.id, nombre: nuevo.nombre, telefono: nuevo.telefono };
        customers = [...s.customers, nuevo];
      }
      return { ...s, customers };
    });

    if (outcome.identity) {
      identityRef.current = outcome.identity;
      setIdentity(outcome.identity);
      try {
        localStorage.setItem(IDENTITY_KEY, JSON.stringify(outcome.identity));
      } catch {}
    }
    if (supabaseEnabled && supabase && outcome.customer) {
      supabase.from("customers").upsert(customerToRow(outcome.customer)).then(({ error }) => error && warn("identificación de cliente", error));
    }

    setIdentityModalOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch {}
  }, [state.cart, hydrated]);

  const addToCart = useCallback((productId: string, varianteId: string | undefined, cantidad = 1) => {
    setState((s) => {
      const existing = s.cart.find((l) => l.productId === productId && l.varianteId === varianteId);
      const cart = existing
        ? s.cart.map((l) => (l === existing ? { ...l, cantidad: l.cantidad + cantidad } : l))
        : [...s.cart, { productId, varianteId, cantidad }];
      return { ...s, cart };
    });
  }, []);

  const removeFromCart = useCallback((productId: string, varianteId?: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((l) => !(l.productId === productId && l.varianteId === varianteId)) }));
  }, []);

  const setCartQty = useCallback((productId: string, varianteId: string | undefined, cantidad: number) => {
    setState((s) => ({
      ...s,
      cart: cantidad <= 0
        ? s.cart.filter((l) => !(l.productId === productId && l.varianteId === varianteId))
        : s.cart.map((l) => (l.productId === productId && l.varianteId === varianteId ? { ...l, cantidad } : l)),
    }));
  }, []);

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  const cartCount = useMemo(() => state.cart.reduce((a, l) => a + l.cantidad, 0), [state.cart]);
  const cartTotal = useMemo(() => {
    return state.cart.reduce((sum, line) => {
      const p = state.products.find((pp) => pp.id === line.productId);
      if (!p) return sum;
      const precio = p.precioOferta ?? p.precio;
      const variantExtra = p.variantes?.find((v) => v.id === line.varianteId)?.precioExtra ?? 0;
      return sum + (precio + variantExtra) * line.cantidad;
    }, 0);
  }, [state.cart, state.products]);

  const performToggleLike = useCallback((productId: string) => {
    const deviceId = deviceIdRef.current;
    let newLiked = false;
    let newLikesCount = 0;
    let savedFlag = false;
    const sync: { customer?: Customer } = {};
    setState((s) => {
      const entry = s.engagement.find((e) => e.productId === productId);
      newLiked = !entry?.liked;
      savedFlag = entry?.saved ?? false;
      const engagement = entry
        ? s.engagement.map((e) => (e.productId === productId ? { ...e, liked: newLiked } : e))
        : [...s.engagement, { productId, liked: newLiked, saved: false }];
      const products = s.products.map((p) => {
        if (p.id !== productId) return p;
        newLikesCount = Math.max(0, p.likes + (newLiked ? 1 : -1));
        return { ...p, likes: newLikesCount };
      });
      const identityId = identityRef.current?.id;
      let customers = s.customers;
      if (identityId) {
        customers = s.customers.map((c) => {
          if (c.id !== identityId) return c;
          const has = c.productosLikeados.includes(productId);
          const productosLikeados = newLiked
            ? (has ? c.productosLikeados : [...c.productosLikeados, productId])
            : c.productosLikeados.filter((pid) => pid !== productId);
          const updated = { ...c, productosLikeados, scoreInteres: newLiked ? Math.min(100, c.scoreInteres + 3) : c.scoreInteres };
          sync.customer = updated;
          return updated;
        });
      }
      return { ...s, engagement, products, customers };
    });
    if (supabaseEnabled && supabase) {
      supabase.from("engagement").upsert({ device_id: deviceId, product_id: productId, liked: newLiked, saved: savedFlag, updated_at: new Date().toISOString() }).then(({ error }) => error && warn("like", error));
      supabase.from("products").update({ likes: newLikesCount }).eq("id", productId).then(({ error }) => error && warn("contador de likes", error));
      if (sync.customer) {
        supabase.from("customers").upsert(customerToRow(sync.customer)).then(({ error }) => error && warn("cliente (like)", error));
      }
    }
  }, []);

  const toggleLike = useCallback((productId: string) => {
    if (!identityRef.current) {
      requestIdentity(() => performToggleLike(productId));
      return;
    }
    performToggleLike(productId);
  }, [performToggleLike, requestIdentity]);

  const performToggleSave = useCallback((productId: string) => {
    const deviceId = deviceIdRef.current;
    let newSaved = false;
    let newGuardadosCount = 0;
    let likedFlag = false;
    const sync: { customer?: Customer } = {};
    setState((s) => {
      const entry = s.engagement.find((e) => e.productId === productId);
      newSaved = !entry?.saved;
      likedFlag = entry?.liked ?? false;
      const engagement = entry
        ? s.engagement.map((e) => (e.productId === productId ? { ...e, saved: newSaved } : e))
        : [...s.engagement, { productId, liked: false, saved: newSaved }];
      const products = s.products.map((p) => {
        if (p.id !== productId) return p;
        newGuardadosCount = Math.max(0, p.guardados + (newSaved ? 1 : -1));
        return { ...p, guardados: newGuardadosCount };
      });
      const identityId = identityRef.current?.id;
      let customers = s.customers;
      if (identityId) {
        customers = s.customers.map((c) => {
          if (c.id !== identityId) return c;
          const has = c.productosGuardados.includes(productId);
          const productosGuardados = newSaved
            ? (has ? c.productosGuardados : [...c.productosGuardados, productId])
            : c.productosGuardados.filter((pid) => pid !== productId);
          const updated = { ...c, productosGuardados, scoreInteres: newSaved ? Math.min(100, c.scoreInteres + 5) : c.scoreInteres };
          sync.customer = updated;
          return updated;
        });
      }
      return { ...s, engagement, products, customers };
    });
    if (supabaseEnabled && supabase) {
      supabase.from("engagement").upsert({ device_id: deviceId, product_id: productId, liked: likedFlag, saved: newSaved, updated_at: new Date().toISOString() }).then(({ error }) => error && warn("guardado", error));
      supabase.from("products").update({ guardados: newGuardadosCount }).eq("id", productId).then(({ error }) => error && warn("contador de guardados", error));
      if (sync.customer) {
        supabase.from("customers").upsert(customerToRow(sync.customer)).then(({ error }) => error && warn("cliente (guardado)", error));
      }
    }
  }, []);

  const toggleSave = useCallback((productId: string) => {
    if (!identityRef.current) {
      requestIdentity(() => performToggleSave(productId));
      return;
    }
    performToggleSave(productId);
  }, [performToggleSave, requestIdentity]);

  const isLiked = useCallback((productId: string) => state.engagement.find((e) => e.productId === productId)?.liked ?? false, [state.engagement]);
  const isSaved = useCallback((productId: string) => state.engagement.find((e) => e.productId === productId)?.saved ?? false, [state.engagement]);

  const registerView = useCallback((productId: string) => {
    let newVal = 0;
    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
        if (p.id !== productId) return p;
        newVal = p.vistas + 1;
        return { ...p, vistas: newVal };
      }),
    }));
    if (supabaseEnabled && supabase) {
      supabase.from("products").update({ vistas: newVal }).eq("id", productId).then(({ error }) => error && warn("vista", error));
    }
  }, []);

  const performRegisterShare = useCallback((productId: string) => {
    let newVal = 0;
    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
        if (p.id !== productId) return p;
        newVal = p.compartidos + 1;
        return { ...p, compartidos: newVal };
      }),
    }));
    if (supabaseEnabled && supabase) {
      supabase.from("products").update({ compartidos: newVal }).eq("id", productId).then(({ error }) => error && warn("compartido", error));
    }
  }, []);

  const registerShare = useCallback((productId: string) => {
    if (!identityRef.current) {
      requestIdentity(() => performRegisterShare(productId));
      return;
    }
    performRegisterShare(productId);
  }, [performRegisterShare, requestIdentity]);

  const checkout: AppContextValue["checkout"] = useCallback((data) => {
    const sideEffects: {
      order?: Order;
      productPatches: { id: string; patch: Partial<Product> }[];
      customer?: Customer;
      coupon?: Coupon;
    } = { productPatches: [] };

    setState((s) => {
      const items = s.cart.map((line) => {
        const p = s.products.find((pp) => pp.id === line.productId)!;
        const variante = p.variantes?.find((v) => v.id === line.varianteId);
        const precio = (p.precioOferta ?? p.precio) + (variante?.precioExtra ?? 0);
        return {
          productId: p.id,
          titulo: p.titulo,
          variante: variante?.nombre,
          cantidad: line.cantidad,
          precioUnitario: precio,
          imagen: p.imagen,
        };
      });
      let total = items.reduce((a, i) => a + i.precioUnitario * i.cantidad, 0);
      const coupon = data.cuponCodigo ? s.coupons.find((c) => c.codigo.toLowerCase() === data.cuponCodigo!.toLowerCase() && c.activo) : undefined;
      if (coupon) {
        total = coupon.tipo === "porcentaje" ? total * (1 - coupon.valor / 100) : Math.max(0, total - coupon.valor);
      }
      const order: Order = {
        id: uid("o"),
        cliente: { nombre: data.nombre, telefono: data.telefono, email: data.email },
        items,
        total: Math.round(total),
        entrega: data.entrega,
        direccion: data.direccion,
        metodoPago: data.metodoPago,
        status: "pendiente",
        creadoEn: new Date().toISOString(),
      };
      sideEffects.order = order;

      const products = s.products.map((p) => {
        const line = s.cart.find((l) => l.productId === p.id);
        if (!line) return p;
        const soldQty = line.cantidad;
        let variantes = p.variantes;
        if (line.varianteId && variantes) {
          variantes = variantes.map((v) => (v.id === line.varianteId ? { ...v, stock: Math.max(0, v.stock - soldQty) } : v));
        }
        const stock = Math.max(0, p.stock - soldQty);
        const status = stock === 0 ? "agotado" : p.status;
        sideEffects.productPatches.push({ id: p.id, patch: { stock, variantes, vendidos: p.vendidos + soldQty, status } });
        return { ...p, stock, variantes, vendidos: p.vendidos + soldQty, status };
      });

      let found = false;
      const customers = s.customers.map((c) => {
        if (c.telefono === data.telefono) {
          found = true;
          const updated = {
            ...c,
            totalComprado: c.totalComprado + order.total,
            cantidadPedidos: c.cantidadPedidos + 1,
            ultimaCompra: order.creadoEn,
            esRecurrente: c.cantidadPedidos + 1 > 1,
          };
          sideEffects.customer = updated;
          return updated;
        }
        return c;
      });
      if (!found) {
        const nuevo: Customer = {
          id: uid("c"),
          nombre: data.nombre,
          telefono: data.telefono,
          email: data.email,
          totalComprado: order.total,
          cantidadPedidos: 1,
          deuda: 0,
          ultimaCompra: order.creadoEn,
          esRecurrente: false,
          productosGuardados: [],
          productosLikeados: [],
          scoreInteres: 20,
        };
        customers.push(nuevo);
        sideEffects.customer = nuevo;
      }

      let coupons = s.coupons;
      if (coupon) {
        const updatedCoupon = { ...coupon, usosActuales: coupon.usosActuales + 1 };
        sideEffects.coupon = updatedCoupon;
        coupons = s.coupons.map((c) => (c.id === coupon.id ? updatedCoupon : c));
      }

      return { ...s, products, orders: [order, ...s.orders], customers, coupons, cart: [] };
    });

    const db = supabase;
    if (supabaseEnabled && db && sideEffects.order) {
      db.from("orders").insert(orderToRow(sideEffects.order)).then(({ error }) => error && warn("pedido", error));
      sideEffects.productPatches.forEach(({ id, patch }) => {
        db.from("products").update(productToRow(patch)).eq("id", id).then(({ error }) => error && warn("stock de producto", error));
      });
      if (sideEffects.customer) {
        db.from("customers").upsert(customerToRow(sideEffects.customer)).then(({ error }) => error && warn("cliente", error));
      }
      if (sideEffects.coupon) {
        db.from("coupons").update({ usos_actuales: sideEffects.coupon.usosActuales }).eq("id", sideEffects.coupon.id).then(({ error }) => error && warn("cupón", error));
      }
    }

    return sideEffects.order!;
  }, []);

  const addProduct: AppContextValue["addProduct"] = useCallback((p) => {
    const product: Product = {
      ...p,
      id: uid("p"),
      vendidos: 0,
      creadoEn: new Date().toISOString(),
      likes: 0,
      guardados: 0,
      compartidos: 0,
      vistas: 0,
    };
    setState((s) => ({ ...s, products: [product, ...s.products] }));
    if (supabaseEnabled && supabase) {
      supabase.from("products").insert(productToRow(product)).then(({ error }) => error && warn("producto nuevo", error));
    }
    return product;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setState((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    if (supabaseEnabled && supabase) {
      supabase.from("products").update(productToRow(patch)).eq("id", id).then(({ error }) => error && warn("producto", error));
    }
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
    if (supabaseEnabled && supabase) {
      supabase.from("products").delete().eq("id", id).then(({ error }) => error && warn("eliminar producto", error));
    }
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }));
    if (supabaseEnabled && supabase) {
      supabase.from("orders").update({ status }).eq("id", orderId).then(({ error }) => error && warn("estado de pedido", error));
    }
  }, []);

  const addCoupon: AppContextValue["addCoupon"] = useCallback((c) => {
    const coupon: Coupon = { ...c, id: uid("cp"), usosActuales: 0 };
    setState((s) => ({ ...s, coupons: [coupon, ...s.coupons] }));
    if (supabaseEnabled && supabase) {
      supabase.from("coupons").insert(couponToRow(coupon)).then(({ error }) => error && warn("cupón", error));
    }
  }, []);

  const registerDebtPayment = useCallback((customerId: string, monto: number) => {
    let newDeuda = 0;
    setState((s) => ({
      ...s,
      customers: s.customers.map((c) => {
        if (c.id !== customerId) return c;
        newDeuda = Math.max(0, c.deuda - monto);
        return { ...c, deuda: newDeuda };
      }),
    }));
    if (supabaseEnabled && supabase) {
      supabase.from("customers").update({ deuda: newDeuda }).eq("id", customerId).then(({ error }) => error && warn("pago de deuda", error));
    }
  }, []);

  const generateTargetedOffers = useCallback((): TargetedOffer[] => {
    let generated: TargetedOffer[] = [];
    setState((s) => {
      const candidates: TargetedOffer[] = [];
      s.customers.forEach((c) => {
        const interesados = [...new Set([...c.productosLikeados, ...c.productosGuardados])];
        interesados.forEach((productId) => {
          const yaComprado = s.orders.some(
            (o) => o.cliente.telefono === c.telefono && o.items.some((i) => i.productId === productId)
          );
          if (yaComprado) return;
          const product = s.products.find((p) => p.id === productId);
          if (!product) return;
          const likeado = c.productosLikeados.includes(productId);
          const guardado = c.productosGuardados.includes(productId);
          if (c.scoreInteres < 60 && !(likeado && guardado)) return;
          const motivo = likeado && guardado
            ? "Le dio like y lo guardó, pero todavía no compró"
            : likeado
            ? "Le dio like al producto y no lo compró"
            : "Guardó el producto para más tarde";
          candidates.push({
            id: uid("of"),
            clienteId: c.id,
            clienteNombre: c.nombre,
            productId,
            productTitulo: product.titulo,
            motivo,
            descuentoSugerido: c.scoreInteres >= 85 ? 15 : c.scoreInteres >= 70 ? 12 : 8,
            creadoEn: new Date().toISOString(),
            estado: "sugerida",
          });
        });
      });
      generated = candidates.slice(0, 8);
      return { ...s, offers: generated };
    });
    const db = supabase;
    if (supabaseEnabled && db) {
      // Reemplaza las ofertas sugeridas anteriores por las nuevas.
      db.from("offers").delete().neq("id", "___none___").then(({ error }) => {
        if (error) return warn("limpieza de ofertas", error);
        if (generated.length === 0) return;
        db.from("offers").insert(generated.map(offerToRow)).then(({ error }) => error && warn("ofertas sugeridas", error));
      });
    }
    return generated;
  }, []);

  const updateOfferStatus = useCallback((offerId: string, estado: TargetedOffer["estado"]) => {
    setState((s) => ({ ...s, offers: s.offers.map((o) => (o.id === offerId ? { ...o, estado } : o)) }));
    if (supabaseEnabled && supabase) {
      supabase.from("offers").update({ estado }).eq("id", offerId).then(({ error }) => error && warn("estado de oferta", error));
    }
  }, []);

  const generateAIReport = useCallback((): AIReport => {
    let report: AIReport = {} as AIReport;
    setState((s) => {
      const totalVentas = s.orders.reduce((a, o) => a + o.total, 0);
      const pedidosCount = s.orders.length;
      const ticketPromedio = pedidosCount ? Math.round(totalVentas / pedidosCount) : 0;
      const topProducto = [...s.products].sort((a, b) => b.vendidos - a.vendidos)[0];
      const bajoStock = s.products.filter((p) => p.stock <= p.stockMinimo && p.status !== "agotado");
      const recurrentes = s.customers.filter((c) => c.esRecurrente).length;
      const deudores = s.customers.filter((c) => c.deuda > 0);
      const masGuardado = [...s.products].sort((a, b) => b.guardados - a.guardados)[0];
      const altoInteres = s.customers.filter((c) => c.scoreInteres >= 70 && c.cantidadPedidos === 0);

      const hallazgos = [
        `Ventas totales acumuladas: ${formatMoney(totalVentas)} en ${pedidosCount} pedidos (ticket promedio ${formatMoney(ticketPromedio)}).`,
        topProducto ? `El producto más vendido es "${topProducto.titulo}" con ${topProducto.vendidos} unidades.` : "",
        masGuardado ? `"${masGuardado.titulo}" es el producto más guardado (${masGuardado.guardados} guardados) — alta intención de compra.` : "",
        `${recurrentes} de ${s.customers.length} clientes son recurrentes (compraron más de una vez).`,
        deudores.length ? `Hay ${deudores.length} cliente(s) con saldo pendiente por un total de ${formatMoney(deudores.reduce((a, c) => a + c.deuda, 0))}.` : "No hay clientes con saldo pendiente.",
        bajoStock.length ? `${bajoStock.length} producto(s) con stock bajo: ${bajoStock.map((p) => p.titulo).join(", ")}.` : "Todo el stock está en niveles saludables.",
        `${altoInteres.length} cliente(s) muestran alto interés (likes/guardados) pero todavía no compraron — oportunidad de oferta segmentada.`,
      ].filter(Boolean);

      const recomendaciones = [
        bajoStock.length ? `Reponer stock de: ${bajoStock.map((p) => p.titulo).join(", ")} antes de quedarte sin unidades.` : "",
        altoInteres.length ? `Enviar una oferta personalizada a los ${altoInteres.length} clientes de alto interés para convertir esas visitas en ventas.` : "",
        deudores.length ? "Enviar recordatorio de pago automático a los clientes con saldo pendiente." : "",
        `Crear una promoción flash sobre "${masGuardado?.titulo ?? "tu producto más popular"}" — es el que más deseo genera en tus clientes.`,
      ].filter(Boolean);

      report = {
        id: uid("rep"),
        generadoEn: new Date().toISOString(),
        periodo: "Últimos 30 días",
        resumen: `En este período generaste ${formatMoney(totalVentas)} en ventas con ${pedidosCount} pedidos. Tu tienda tiene ${recurrentes} clientes recurrentes y ${altoInteres.length} clientes de alto interés listos para recibir una oferta.`,
        hallazgos,
        recomendaciones,
      };

      return { ...s, reports: [report, ...s.reports] };
    });
    if (supabaseEnabled && supabase) {
      supabase.from("reports").insert(reportToRow(report)).then(({ error }) => error && warn("reporte", error));
    }
    return report;
  }, []);

  const value: AppContextValue = {
    ...state,
    hydrated,
    dbConnected: supabaseEnabled,
    addToCart,
    removeFromCart,
    setCartQty,
    clearCart,
    cartCount,
    cartTotal,
    toggleLike,
    toggleSave,
    isLiked,
    isSaved,
    registerView,
    registerShare,
    identity,
    identityModalOpen,
    requestIdentity,
    closeIdentityModal,
    identify,
    checkout,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    addCoupon,
    registerDebtPayment,
    generateTargetedOffers,
    updateOfferStatus,
    generateAIReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
