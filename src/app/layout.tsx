import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Montserrat, Bebas_Neue, Orbitron, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Toaster } from "sonner";
import { AppLaunchSplash } from "@/components/AppLaunchSplash";
import { DialogProvider } from "@/context/DialogContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.gymboost.tr';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "GymBoost Console",
    template: "%s | GB Console"
  },
  description: "GymBoost sistem yönetim ve geliştirici konsolu.",
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GB Console',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable} ${montserrat.variable} ${bebas.variable} ${orbitron.variable} ${playfair.variable} font-sans antialiased bg-black text-white min-h-screen selection:bg-orange-500/30`}>
        <DialogProvider>
          {children}
          <ServiceWorkerRegistrar />
        </DialogProvider>
        <Toaster
          theme="dark"
          position="top-right"
          closeButton
          richColors
          expand={true}
          toastOptions={{
            style: {
              background: 'rgba(9, 9, 11, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '24px',
              fontSize: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '450px',
              width: '100%'
            },
            className: 'font-sans',
            descriptionClassName: 'text-zinc-400 text-sm mt-1'
          }}
        />
      </body>
    </html>
  );
}
