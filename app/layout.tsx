import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans, Special_Gothic_Expanded_One, Gravitas_One } from "next/font/google";
import ThemeScript from "@/components/ThemeScript";
import CookieBanner from "@/components/CookieBanner";
import Toast from "@/components/Toast";
import KeyboardScrollFix from "@/components/KeyboardScrollFix";
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

// Experimentální fonty — zatím jen pro testovací recept
// (viz app/recepty/[slug]/page.tsx), nepoužívá se globálně.
const specialGothicExpandedOne = Special_Gothic_Expanded_One({
  subsets: ["latin", "latin-ext"],
  variable: "--font-special-gothic",
  weight: "400",
  display: "swap",
});

const gravitasOne = Gravitas_One({
  subsets: ["latin"],
  variable: "--font-gravitas",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mnamio",
  description: "Mnamio — porovnání akčních cen potravin a chytré nákupní seznamy",
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
        {/* Stack Sans Text není v next/font/google databázi — načteno přímo, zatím jen pro testovací recept. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Text&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.variable} ${plusJakartaSans.variable} ${specialGothicExpandedOne.variable} ${gravitasOne.variable} font-sans antialiased`}>
        <ThemeScript />
        <KeyboardScrollFix />
        {children}
        <CookieBanner />
        <Toast />
      </body>
    </html>
  );
}
