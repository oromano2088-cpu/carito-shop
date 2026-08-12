# CARITO.SHOP — Prototipo funcional

Prototipo funcional de tienda online (Next.js + TypeScript + Tailwind), mobile-first,
estilo oscuro/tech. Incluye tienda pública y panel de administración.

## Qué incluye este prototipo

**Tienda pública**
- Catálogo con imagen grande, precio, variantes y botón de compra directo (`/`)
- Feed estilo Instagram: un producto a la vez, con like ❤️, guardar 🔖 y compartir por WhatsApp ↗️ (`/feed`)
- Página de guardados / me gusta del cliente (`/guardados`)
- Ficha de producto completa (`/producto/[id]`)
- Carrito (`/carrito`)
- Checkout guiado paso a paso: datos → entrega → pago → confirmación (`/checkout`)
- Descuentos por tiempo limitado con contador regresivo
- Botón de WhatsApp directo para consultas

**Panel de administración** (`/admin`, pensado para usar desde el celular)
- Protegido con PIN: se accede tocando el botón "🔒 Admin" arriba del catálogo.
  PIN por defecto: `2580` (se cambia en `src/components/AdminGate.tsx`, constante `ADMIN_PIN`)
- Dashboard con ventas, ticket promedio, alertas de stock bajo y clientes deudores
- Carga de productos con foto: simula el autocompletado con IA (título, descripción,
  categoría, precio sugerido) — en producción esto llama a un modelo de visión real
  (ver spec técnica)
- Gestión de stock y estado de productos
- Pedidos con estados personalizables y botón de aviso por WhatsApp
- CRM de clientes: recurrentes, deudores, score de interés
- Marketing: cupones, ofertas y posteos listos para compartir en redes
- Asistente IA: genera reportes automáticos (ventas, top productos, alertas) y
  detecta clientes con alto interés (likes/guardados) sin compra para sugerirles
  un descuento personalizado

Todos los datos son de ejemplo (seed) y se guardan en el navegador (localStorage)
para que puedas navegar la demo de punta a punta sin backend. Para producción,
reemplazar por Supabase/Postgres según la especificación técnica adjunta.

## Cómo correrlo en tu computadora

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abrí http://localhost:3000 — la tienda pública está en `/` y el panel admin en `/admin`.

## Cómo desplegarlo (ponerlo online)

La forma más simple y gratuita para empezar:

1. Subí esta carpeta a un repositorio de GitHub.
2. Entrá a [vercel.com](https://vercel.com), conectá tu cuenta de GitHub e importá el repositorio.
3. Vercel detecta que es Next.js automáticamente y lo despliega — en 2 minutos tenés una URL pública.
4. (Opcional) Conectá tu propio dominio, por ejemplo `caritoshop.com`, desde el panel de Vercel.

## Cómo hacer que tus clientes lo instalen como una app en el celular

Esta tienda es una PWA (Progressive Web App): una vez que está publicada online (paso anterior),
cualquier cliente puede "instalarla" en su celular sin pasar por Google Play ni App Store:

1. Compartile el link de tu tienda (por WhatsApp, por ejemplo).
2. **Android (Chrome)**: al entrar va a aparecer un cartel "Agregar a pantalla de inicio", o lo
   pueden hacer manualmente desde el menú ⋮ → "Instalar app" / "Agregar a pantalla de inicio".
3. **iPhone (Safari)**: tocar el botón de compartir (el cuadrado con la flecha hacia arriba) →
   "Agregar a pantalla de inicio".
4. Les queda el ícono de CARITO.SHOP en su pantalla de inicio, como cualquier otra app, y se abre
   a pantalla completa sin las barras del navegador.

Esto **solo funciona con la tienda publicada online** (con una URL real, no `localhost`) — es el
motivo principal para hacer el paso de despliegue en Vercel.

## Cómo conectar una base de datos real (Supabase)

Sin esto, cada visitante ve los datos de ejemplo guardados en su propio navegador — si vos cargás
un producto, tus clientes no lo ven. Con Supabase conectado, todos ven el mismo catálogo y pedidos
en tiempo real.

1. Creá una cuenta gratis en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. Andá a **SQL Editor** (menú izquierdo) → **New query**, pegá el contenido de `supabase/schema.sql`
   y tocá **Run**. Repetí el mismo paso con `supabase/seed.sql` si querés arrancar con productos de
   ejemplo.
3. Andá a **Project Settings → API** y copiá el **Project URL** y el **anon public key**.
4. Local: copiá `.env.local.example` como `.env.local` y completá esos dos valores.
5. Online (Vercel): en el dashboard del proyecto → **Settings → Environment Variables**, agregá
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con esos mismos valores, y volvé a
   desplegar (`vercel --prod`).

El panel admin muestra un indicador arriba a la derecha: 🟢 si está conectado, 🟡 si sigue en modo
demo.

## Qué falta para producción

Este prototipo demuestra el flujo y la experiencia completa. Para producción real hay
que conectar (ver la especificación técnica adjunta para el detalle de cada uno):

- **Base de datos real**: Supabase (Postgres) en lugar de localStorage
- **Pagos**: Mercado Pago (Checkout Pro / API)
- **WhatsApp**: WhatsApp Business Cloud API para notificaciones automáticas
- **IA de fotos**: API de visión (GPT-4o / Claude) para el autocompletado real de productos
- **Envíos**: integración con Correo Argentino / OCA / Andreani, o gestión manual propia
- **Hosting**: Vercel (frontend) + Supabase (backend), ambos con planes gratuitos para empezar

## Estructura del proyecto

```
src/
  app/                 páginas (App Router de Next.js)
    admin/             panel de administración
    producto/[id]/     ficha de producto
    feed/               feed estilo Instagram
    checkout/          checkout guiado
  components/          componentes reutilizables (UI, header, nav, tarjetas)
  lib/
    types.ts           modelos de datos (Producto, Pedido, Cliente, etc.)
    seed-data.ts        datos de ejemplo
    store-context.tsx  estado global de la app (productos, carrito, pedidos, IA)
```
