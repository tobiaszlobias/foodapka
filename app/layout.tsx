import type { Metadata } from "next";
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
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
