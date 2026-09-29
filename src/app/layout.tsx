import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store-context";
import { IdentityModal } from "@/components/IdentityModal";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CARITO.SHOP — Tienda de tecnología y accesorios en Argentina",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_AR",
    title: "CARITO.SHOP — Tienda de tecnología y accesorios",
    description: SITE_DESCRIPTION,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: { card: "summary", title: SITE_NAME, description: SITE_DESCRIPTION },
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
  themeColor: "#0b0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/icons/icon-512.png`,
              description: SITE_DESCRIPTION,
              areaServed: "AR",
              currenciesAccepted: "ARS",
            }),
          }}
        />
        <AppProvider>
          {children}
          <IdentityModal />
        </AppProvider>
      </body>
    </html>
  );
}
