import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import ThemeScript from "@/components/ThemeScript";
import CookieBanner from "@/components/CookieBanner";
import HelpModal from "@/components/HelpModal";
import Toast from "@/components/Toast";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "foodappka",
  description: "Porovnání akčních cen potravin a recepty s chytrým nákupem",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover je nutné, aby env(safe-area-inset-*) vracelo reálné hodnoty na iPhonech
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.variable} ${plusJakartaSans.variable} font-sans antialiased`}>
        <ThemeScript />
        {children}
        <CookieBanner />
        <HelpModal />
        <Toast />
      </body>
    </html>
  );
}
