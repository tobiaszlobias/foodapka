# 🥬 Foodapka

**Foodapka** je moderní webová aplikace pro chytré nakupování potravin. Pomáháme vám najít nejlepší akční ceny z českých letáků a efektivně plánovat vaření díky integrovanému vyhledávači receptů.

## ✨ Klíčové funkce

- **🔍 Srovnávač akcí:** Vyhledejte libovolnou potravinu a okamžitě uvidíte, kde je právě nejlevnější (Lidl, Kaufland, Albert, Tesco, Penny, Billa a další).
- **🥘 Recepty na míru:** Vyberte si jídlo, které chcete uvařit, a my vám spočítáme nákupní seznam z aktuálně zlevněných surovin.
- **🐶 Hlídací pes:** Sledujte vývoj cen a nenechte si ujít ty nejlepší nabídky.
- **❤️ Oblíbené:** Ukládejte si produkty a recepty, které máte rádi, pro rychlý přístup.
- **📝 Nákupní seznamy:** Sestavte si seznam surovin a sdílejte ho s rodinou.
- **🌓 Dark Mode:** Pohodlné používání ve dne i v noci.

## 🛠 Technologie

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend & Auth:** Supabase
- **Data:** Custom scrapery (Cheerio) pro české maloobchodní řetězce

## 🚀 Jak začít

1. Nainstalujte závislosti:
   ```bash
   npm install
   ```

2. Nastavte proměnné prostředí v souboru `.env.local` (Supabase URL a klíče).

3. Spusťte vývojový server:
   ```bash
   npm run dev
   ```

4. Otevřete [http://localhost:3000](http://localhost:3000) ve vašem prohlížeči.

## 📄 Dokumentace

Podrobnější technické informace a pravidla pro vývoj naleznete v souboru [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---
© 2026 foodapka. Všechna práva vyhrazena.
