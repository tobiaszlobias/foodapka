# Zdroje dat - Foodappka

Tento dokument obsahuje kompletní seznam všech externích zdrojů dat používaných v aplikaci Foodappka. Před nasazením aplikace prosím zkontrolujte obchodní podmínky jednotlivých služeb.

---

## 1. Kupi.cz

**Typ:** Web scraping (HTML parsing)

| Položka | Odkaz |
|---------|-------|
| Hlavní stránka | https://www.kupi.cz |
| Vyhledávání | https://www.kupi.cz/hledej?f={query} |
| Detaily slev | https://www.kupi.cz/sleva/{id} |
| Obchodní podmínky | https://www.kupi.cz/obchodni-podminky |
| GDPR / Ochrana osobních údajů | https://www.kupi.cz/ochrana-osobnich-udaju |

**Data získáváme:**
- Názvy produktů
- Ceny a jednotkové ceny
- Procentuální slevy
- Platnost akce
- Odkazy na letáky
- Informace o prodejnách (Albert, Tesco, Billa, Globus, Penny, Flop, JIP, Hruška...)

---

## 2. Lidl.cz

**Typ:** Web scraping (HTML + embedded JSON)

| Položka | Odkaz |
|---------|-------|
| Hlavní stránka | https://www.lidl.cz |
| Vyhledávání | https://www.lidl.cz/q/search?q={query} |
| Aktuální nabídka | https://www.lidl.cz/c/ceny-v-klidu/ |
| Obchodní podmínky | https://www.lidl.cz/c/obchodni-podminky/s10010684 |
| Ochrana osobních údajů | https://www.lidl.cz/c/prohlaseni-o-ochrane-osobnich-udaju/s10009389 |
| Podmínky používání webu | https://www.lidl.cz/c/podminky-pouzivani/s10010682 |

**Data získáváme:**
- Názvy produktů
- Ceny (aktuální i původní)
- Informace o balení/jednotkové ceně
- URL produktů

---

## 3. Kaufland.cz

**Typ:** Web scraping (HTML + embedded SSR JSON)

| Položka | Odkaz |
|---------|-------|
| Hlavní stránka | https://www.kaufland.cz |
| Vyhledávání nabídek | https://prodejny.kaufland.cz/vyhledat.html?q={query} |
| Aktuální týden | https://prodejny.kaufland.cz/nabidka/aktualni-tyden.html |
| Detail nabídky | https://prodejny.kaufland.cz/nabidka/prehled.html?kloffer-articleID={id} |
| Obchodní podmínky | https://www.kaufland.cz/customer-service/legal/terms-and-conditions.html |
| Ochrana osobních údajů | https://www.kaufland.cz/customer-service/legal/privacy-policy.html |
| Právní informace | https://www.kaufland.cz/customer-service/legal.html |

**Data získáváme:**
- Názvy produktů
- Ceny a jednotkové ceny
- Slevy (procentuální i absolutní)
- Platnost akce (od-do)
- URL nabídek

---

## 4. Foodora.cz (Dříve Dáme Jídlo)

**Typ:** GraphQL API

| Položka | Odkaz |
|---------|-------|
| Hlavní stránka | https://www.foodora.cz |
| GraphQL API endpoint | https://cz.fd-api.com/api/v5/graphql |
| Obchodní podmínky | https://www.foodora.cz/contents/terms-and-conditions.htm |
| Ochrana osobních údajů | https://www.foodora.cz/contents/privacy.htm |
| Právní informace | https://www.foodora.cz/contents/impressum.htm |

**Připojené obchody přes Foodora:**

| Obchod | Vyhledávání produktů | Vendor Code |
|--------|---------------------|-------------|
| Albert | https://www.foodora.cz/shop/im7c/albert-praha-breitcetlova/search?q={query} | `im7c` |
| Billa | https://www.foodora.cz/shop/vhcp/billa-ceske-budejovice/search?q={query} | `vhcp` |
| Globus | https://www.foodora.cz/shop/zq61/globus-hypermarket-brno/search?q={query} | `zq61` |
| Tesco | https://www.foodora.cz/shop/ik68/tesco-hypermarket-opava/search?q={query} | `ik68` |

**Data získáváme:**
- Názvy produktů
- Aktuální a původní ceny
- Dostupnost produktů
- Jednotkové ceny
- Aktivní kampaně/slevy

---

## 5. Loga obchodních řetězců

Aplikace používá loga následujících obchodů (uloženo lokálně v `/public`):

| Obchod | Soubor loga |
|--------|-------------|
| Kaufland | `/kauflandlogo.png` |
| Lidl | `/lidllogo.png` |
| Albert | `/albertlogo.png` |
| Tesco | `/tescologo.png` |
| Globus | `/globuslogo.png` |
| Billa | `/billalogo.png` |
| Penny | `/pennylogo.png` |
| Flop | `/logo-flop-top-web.png` |
| JIP | `/jiplogo.png` |
| Hruška | `/hruskalogo.png` |

**Poznámka:** Loga jsou ochranné známky příslušných společností. Před použitím ověřte licenční podmínky.

---

## Souhrn oblastí k prověření

### Právní aspekty web scrapingu
- [ ] Kupi.cz - podmínky používání a robots.txt
- [ ] Lidl.cz - podmínky používání a robots.txt  
- [ ] Kaufland.cz - podmínky používání a robots.txt

### API podmínky
- [ ] Foodora - GraphQL API Terms of Service
- [ ] Foodora - Rate limiting a fair use policy

### Ochranné známky
- [ ] Loga obchodů - licenční podmínky pro použití log
- [ ] Názvy řetězců - použití v aplikaci

### GDPR
- [ ] Zpracování uživatelských dat
- [ ] Ukládání cookies (pokud aplikuje)

---

## Technické poznámky

### HTTP Headers používané pro scraping
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: text/html,application/xhtml+xml,application/xml
Accept-Language: cs-CZ,cs;q=0.9
```

### Foodora GraphQL
- Client version: `GROCERIES-MENU-MICROFRONTEND.26.13.0000`
- Global Entity ID: `DJ_CZ`
- Language: `cs` / Locale: `cs_CZ`

---

*Poslední aktualizace: Duben 2026*
