import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store-context";
import { IdentityModal } from "@/components/IdentityModal";

export const metadata: Metadata = {
  title: "CARITO.SHOP — Tecnología con onda",
  description: "Tu tienda de tecnología: celulares, notebooks, audio, gaming y más. Comprá fácil, seguí tu pedido y hablanos por WhatsApp.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CARITO.SHOP" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProvider>
          {children}
          <IdentityModal />
        </AppProvider>
      </body>
    </html>
  );
}
