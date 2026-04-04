import type { Metadata } from "next";
import ThemeScript from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "foodapka",
  description: "Porovnání akčních cen potravin a recepty s chytrým nákupem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
