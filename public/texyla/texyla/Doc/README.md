# Texyla (rewrite)

Editor k textarey pro [Texy!](https://texy.info) syntaxi s náhledem vygenerovaného HTML.

Moderní přepis původní Texyly (krteczek - Petr Vaněk a Jan Marek) do vanilla JavaScriptu, bez závislosti na jQuery.
Editor je soběstačný balíček — obsahuje JavaScript, PHP endpoint pro náhled, výchozí téma
a továrnu na Texy instance podle profilů.

---

## Historie

Texyla vznikla v roce 2006/2007 jako jednoduchý editor k textarey pro Texy!
syntaxi. První verze (0.2) byla dílem Petra Vaňka — pár tlačítek ovládaných
JavaScriptem, nad textareou blok, do kterého se zobrazoval návrat z AJAXového
volání. Později se přidali Jan Marek a další přispěvatelé a Texyla 0.3 β / 0.4
přinesla objektový návrh, více instancí na stránce, PHP rozhraní a nový vzhled
(viz [archiv changelogu](https://web.archive.org/web/20070621181705/http://texyla.jaknato.com/changelog.php)).

---

## Požadavky

- PHP 8.1 nebo novější (Texy 3.2.6+ vyžaduje PHP 8.1–8.5)
- [Composer](https://getcomposer.org/)
- Moderní prohlížeč (ES2020+, `fetch`, `dataset`)

---

## Instalace

Balíček se distribuuje jako ZIP. Rozbalte ho do složky, která je dostupná z webu
(např. `public/texyla/`), a v kořeni projektu spusťte:

```bash
composer install
```

Tím se nainstaluje závislost Texy (texy/texy) do složky vendor/.

    Pozor: vendor/ není součástí ZIPu. Vytvoří si ho Composer sám.

Rychlý start

    Otevřete demo.php v prohlížeči.

    Do textarey napište Texy! syntaxi.

    Klikněte na Náhled — editor zavolá texyla.php, ten vygeneruje HTML a zobrazí ho.

Demo obsahuje čtyři profily: admin, forum, codeforum, default.
Každý profil má jinou sadu povolených elementů a jiný toolbar.
Použití ve vlastní aplikaci

Na stránku vložte textareu s třídou texyla a příslušnými data-* atributy:
html

<textarea
    class="texyla"
    data-profile="forum"
    data-theme="default"
    data-endpoint="texyla/texyla.php"
    data-debug="0"
    rows="12"
    cols="80"
></textarea>

<script src="texyla/texyla.js"></script>

Editor se inicializuje sám při načtení stránky pro všechny textarea.texyla.
data-* atributy
Atribut	Význam	Výchozí
data-profile	Profil (admin, forum, codeforum, default)	default
data-theme	Téma (default) — načte texyla/themes/<téma>/theme.css	default
data-endpoint	Cesta k PHP endpointu pro náhled	texyla/texyla.php
data-debug	1 = zobrazit i vygenerované HTML pod náhledem	0
Profily

Profil určuje, které Texy elementy jsou povolené a která tlačítka se zobrazí v toolbaru.
Profily jsou definované na dvou místech:

    PHP: src/Factory/TexyFactory.php — whitelist elementů pro Texy.

    JS: texyla.js — sada tlačítek v toolbaru.

Profil	Popis
admin	Plná sada — nadpisy, seznamy, tabulky, obrázky, bloky kódu, HTML.
forum	Bezpečnější — tučné, kurzíva, kód, odkazy, citace, seznamy.
codeforum	Jako forum + bloky kódu.
default	Minimální — tučné, kurzíva, inline kód, odkazy.

    Důležité: Pokud přidáte nový profil, musíte ho zaregistrovat na obou místech
    (TexyFactory::PROFILES i v PROFILES v texyla.js) a přidat ho do whitelistu
    v texyla.php.

Struktura balíčku
text

texyla/
├── demo.php                  # ukázková stránka se čtyřmi profily
├── texyla.js                 # editor (toolbar + náhled)
├── texyla.php                # PHP endpoint pro náhled (POST)
├── README.md                 # tento soubor
├── doc/
│   ├── LICENSE-MIT-en.txt    # oficiální anglický text MIT
│   ├── LICENSE-MIT-cs.txt    # neoficiální český překlad MIT
│   └── README.md             # licenční vysvětlivky
├── src/
│   └── Factory/
│       └── TexyFactory.php   # továrna na Texy instance podle profilu
└── themes/
    └── default/
        └── theme.css         # výchozí téma

Jak to funguje

    JS najde všechny textarea.texyla, načte téma, vytvoří toolbar a tlačítko Náhled.

    Po kliknutí na Náhled pošle POST na data-endpoint s JSONem:
    json

    { "texy_source": "...", "profile": "forum" }

    PHP endpoint (texyla.php) načte vendor/autoload.php, vytvoří Texy instanci
    přes TexyFactory::createForProfile($profile), zpracuje zdroj a vrátí HTML.

    JS vloží HTML do panelu náhledu. Pokud je data-debug="1", zobrazí i zdrojový HTML.

Bezpečnost

    Endpoint povoluje jen metodu POST.

    Profil je omezen whitelistem (admin, forum, codeforum, default).

    TexyFactory používá whitelist elementů — nepovolené elementy Texy ignoruje.

    Výstup je ošetřen (htmlspecialchars v chybových hláškách, X-Content-Type-Options: nosniff).

    Doporučení: Pokud je public/ document root, zvažte omezení přímého přístupu
    k src/ pomocí .htaccess (Require all denied), aby nebylo možné stáhnout
    TexyFactory.php přes URL. PHP ho načítá přes require_once, takže to fungovat bude.

Závislosti

    Texy (texy/texy) — PHP knihovna pro zpracování Texy! syntaxe.
    Instaluje se přes Composer, není součástí tohoto balíčku.

Licence

Texyla je distribuována pod licencí MIT.

    Oficiální (a právně závazný) text: doc/LICENSE-MIT-en.txt

    Neoficiální český překlad: doc/LICENSE-MIT-cs.txt

    V případě rozporu mezi českým překladem a anglickým originálem platí anglický originál.

Závislost Texy

Texy je dostupné pod licencí New BSD nebo GPL v2/v3.
Texy není součástí tohoto balíčku — uživatel si ji instaluje sám přes Composer
a řídí se její licencí. Tím je zajištěno, že licence Texyly (MIT) a Texy (BSD/GPL)
zůstávají oddělené.
Autor

Petr Vaněk — krteczek01@gmail.com

Původní Texyla: Jan Marek (2009–2011).
Stav projektu

Rozpracovaný rewrite. Funkční jádro: toolbar, náhled, profily, témata.
Plánováno: další tlačítka, klávesové zkratky, více témat, testy.
text


### 💡 Poznámky k README

1. **Odkazy na `doc/LICENSE-MIT-*.txt`** — pokud soubory pojmenujete jinak, upravte cesty.
2. **Sekce „Bezpečnost"** — zmiňuje `.htaccess` jako doporučení, ne jako povinnost. To odpovídá vašemu rozhodnutí nechat `TexyFactory.php` v `public/`.
3. **Sekce „Profily"** — explicitně říká, že nový profil je potřeba zaregistrovat na dvou místech. To je častý zdroj chyb.
4. **Licence** — jasně odděluje Texylu (MIT) a Texy (BSD/GPL), což je přesně to, co jste chtěl.
5. **`data-debug`** — v README má výchozí `0`, i když v `demo.php` máte `1`. To je záměr — demo má debug zapnutý, produkce by měla mít vypnuto.

Kdybyste chtěl README zkrátit (např. bez sekce „Jak to funguje") nebo naopak rozšířit (např. o příklady Texy syntaxe), dejte vědět. 👍
