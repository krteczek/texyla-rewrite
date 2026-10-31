Tady je nový `README.md` s **opraveným stromem** podle skutečné struktury (`public/texyla/` = balíček, `demo.php` je jeho součástí).

### 📄 `README.md`

```markdown
# Texyla (rewrite)

Editor k textarey pro [Texy!](https://texy.info) syntaxi s náhledem vygenerovaného HTML.

Moderní přepis původní Texyly (Petr Vaněk a Jan Marek) do vanilla JavaScriptu,
bez závislosti na jQuery. Editor je soběstačný balíček — obsahuje JavaScript,
PHP endpoint pro náhled, výchozí téma, konfiguraci tlačítek a demo.

---

## Historie

Texyla vznikla v roce 2006/2007 jako jednoduchý editor k textarey pro Texy!
syntaxi. První verze (0.2) byla dílem Petra Vaňka — pár tlačítek ovládaných
JavaScriptem, nad textareou blok, do kterého se zobrazoval návrat z AJAXového
volání. Později se přidali Jan Marek a další přispěvatelé a Texyla 0.3 β / 0.4
přinesla objektový návrh, více instancí na stránce, PHP rozhraní a nový vzhled
(viz [archiv changelogu](https://web.archive.org/web/20070621181705/http://texyla.jaknato.com/changelog.php)).

Tento rewrite navazuje na původní myšlenku — editor k textarey s náhledem
vygenerovaného HTML — ale staví na moderních základech:

- **vanilla JavaScript** místo jQuery,
- **`fetch` + JSON** místo starých AJAXových volání,
- **`Config` (extract/apply)** místo pevných profilů,
- **CSS proměnné** místo pevného vzhledu,
- **Texy 3.x** místo Texy 2.x.

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

Tím se nainstaluje závislost **Texy** (`texy/texy`) do složky `vendor/`.

> **Pozor:** `vendor/` není součástí ZIPu. Vytvoří si ho Composer sám.

---

## Rychlý start

1. Otevřete `demo.php` v prohlížeči (je součástí balíčku).
2. Do textarey napište Texy! syntaxi.
3. Klikněte na **Náhled** — editor zavolá `texyla/Php/texyla.php`, ten vygeneruje HTML a zobrazí ho.

Demo obsahuje tři ukázkové profily (`admin`, `forum`, `default`), které se přepínají
přes `?profile=...`. **Nejsou to profily Texyly** — jsou to jen ukázková data
v `demo.php`, která předvádějí, jak se `config` předává do textarey.

---

## Použití ve vlastní aplikaci

### 1. Připravte `config` z vaší Texy instance

Aplikace má obvykle **vlastní Texy instanci** (např. pro zobrazení článků, komentářů,
fóra). Texyla potřebuje její nastavení, aby náhled odpovídal tomu, co aplikace
vyrenderuje z databáze.

```php
// Vaše Texy instance pro danou textareu
$texy = new \Texy\Texy();
$texy->allowed['table'] = true;
$texy->allowed['block/code'] = true;
// ...

// Vytáhněte nastavení do serializovatelné podoby
$config = \Texyla\Config::extract($texy);
```

### 2. Vložte textareu s `data-texyla-config`

```html
<textarea
    class="texyla"
    data-texyla-config='<?= \Texyla\Config::toJson($config) ?>'
    data-endpoint="texyla/Php/texyla.php"
    data-theme="default"
    data-debug="0"
    rows="12"
    cols="80"
></textarea>

<script src="texyla/js/config/buttons.js"></script>
<script src="texyla/js/config/order.js"></script>
<script src="texyla/js/texyla.js"></script>
```

Editor se inicializuje sám při načtení stránky pro všechny `textarea.texyla`.

### `data-*` atributy

| Atribut | Význam | Výchozí |
|---|---|---|
| `data-texyla-config` | JSON s nastavením Texy (`Config::toJson($config)`) | *(chybí → hláška)* |
| `data-theme` | Téma (`default`) — načte `texyla/themes/<téma>/theme.css` | `default` |
| `data-endpoint` | Cesta k PHP endpointu pro náhled | `texyla/Php/texyla.php` |
| `data-debug` | `1` = zobrazit i vygenerované HTML pod náhledem | `0` |

### 3. Endpoint `texyla/Php/texyla.php`

Endpoint přijme `POST` s JSONem:

```json
{ "texy_source": "...", "config": { ... } }
```

Na serveru se vytvoří **slepá instance Texy**, aplikuje se `config` a vrátí se HTML:

```php
$texy = new \Texy\Texy();
\Texyla\Config::apply($texy, $config);
echo $texy->process($source);
```

---

## Jak to funguje

1. **JS** najde všechny `textarea.texyla`, načte `data-texyla-config`, vytvoří toolbar
   z `config.allowed` (přes `texyla/js/config/buttons.js` a `texyla/js/config/order.js`)
   a tlačítko **Náhled**.
2. Po kliknutí na **Náhled** pošle `POST` na `data-endpoint` s JSONem:
   ```json
   { "texy_source": "...", "config": { ... } }
   ```
3. **PHP endpoint** (`texyla/Php/texyla.php`) načte `vendor/autoload.php`, vytvoří
   **slepou instanci** Texy, aplikuje `config` přes `Config::apply()` a vrátí HTML.
4. **JS** vloží HTML do panelu náhledu. Pokud je `data-debug="1"`, zobrazí i zdrojový HTML.

### Proč žádné profily?

Texyla **nemá vlastní profily** (admin, forum, …). Místo toho si **bere nastavení
z aplikace** — ta má svou Texy instanci a předá její `allowed` do textarey.
Texyla ho aplikuje na slepou instanci a vyrenderuje náhled.

To zajišťuje, že **náhled v editoru odpovídá tomu, co aplikace vyrenderuje**
z databáze — a nastavení je **na jednom místě** (v aplikaci), ne duplikované
v Texyle.

### Toolbar se generuje z `config.allowed`

Toolbar není pevný — generuje se **dynamicky** z `config.allowed`. JavaScript má
mapu `BUTTONS` (Texy klíč → tlačítko) a `ORDER` (pořadí). Zobrazí se jen ta
tlačítka, jejichž Texy klíč je v `allowed` povolený a která mají v `BUTTONS` definici.

- **Aplikace nemusí vědět o tlačítkách** — stačí jí dodat `allowed`.
- **JS nemusí znát profily** — stačí mu `allowed`.
- **Nový Texy element** = přidat do `BUTTONS` a `ORDER` v JS. PHP se nemění.

### Stavy konfigurace

JS rozlišuje **10 stavů** konfigurace a ke každému zobrazí odpovídající hlášku:

| Stav | Hláška |
|---|---|
| `data-texyla-config` chybí | „Konfigurace Texy nebyla načtena…" |
| `data-texyla-config` je prázdný | „Konfigurace Texy je prázdná…" |
| Neplatný JSON | „Konfigurace Texy je neplatná…" |
| JSON není objekt | „Konfigurace Texy nemá správný tvar…" |
| `allowed` chybí | „Konfigurace Texy neobsahuje klíč allowed…" |
| `allowed` není objekt | „Konfigurace Texy má neplatný klíč allowed…" |
| `allowed` je prázdný | „Konfigurace Texy neobsahuje žádné elementy…" |
| `allowed` vše `false` | „Nastavení Texy je úplně vypnuto…" |
| `allowed` má `true`, ale žádné tlačítko | „Pro povolené elementy nejsou v toolbaru definována tlačítka…" |
| Vše v pořádku | *(žádná hláška — toolbar se zobrazí)* |

---

## Struktura balíčku

```
texyla/                         # ← kořen balíčku (to, co se zabalí do ZIPu)
├── demo.php                    # ukázková stránka
├── demoTexyCleaner.php         # vyčištění nastavení (demo)
├── demoTexyProfiles.php        # ukázková nastavení (demo)
├── demo.txt                    # ukázkový Texy zdroj
└── texyla/                     # ← samotný editor
    ├── Doc/
    │   ├── LICENSE-MIT-en.txt  # oficiální anglický text MIT
    │   ├── LICENSE-MIT-cs.txt  # neoficiální český překlad MIT
    │   └── README.md           # licenční vysvětlivky
    ├── js/
    │   ├── config/
    │   │   ├── buttons.js      # mapa tlačítek (Texy klíč → tlačítko)
    │   │   └── order.js        # pořadí tlačítek
    │   └── texyla.js           # editor (toolbar + náhled)
    ├── Php/
    │   ├── Src/
    │   │   ├── Config.php      # extract/apply nastavení Texy
    │   │   └── helpers.php     # autoload, checkTexy
    │   └── texyla.php          # PHP endpoint pro náhled (POST)
    └── themes/
        └── default/
            └── theme.css       # výchozí téma
```

> **Poznámka:** Do ZIPu **nepatří** `vendor/` — ten si vytvoří Composer
> přes `composer install`. Do ZIPu **nepatří** ani `public/index.php_` —
> to je jen ilustrační placeholder.

---

## Bezpečnost

- Endpoint povoluje **jen metodu POST**.
- `config` z klienta se **validuje** v `Config::apply()` — neznámé klíče, špatné typy
  a hodnoty mimo rozsah se ignorují.
- `Config::toJson()` používá `JSON_HEX_*` — zabrání XSS přes `</textarea>`.
- Chráněné soubory (`Config.php`, `helpers.php`) mají ochranu `TEXYLA_ENTRY` —
  přímý přístup přes URL vrátí 404.
- Výstup je ošetřen (`htmlspecialchars` v chybových hláškách,
  `X-Content-Type-Options: nosniff`).

---

## Závislosti

- **[Texy](https://texy.info)** (`texy/texy`) — PHP knihovna pro zpracování Texy! syntaxe.
  Instaluje se přes Composer, **není** součástí tohoto balíčku.

---

## Licence

Texyla je distribuována pod licencí **MIT**.

- Oficiální (a právně závazný) text: [`texyla/Doc/LICENSE-MIT-en.txt`](texyla/Doc/LICENSE-MIT-en.txt)
- Neoficiální český překlad: [`texyla/Doc/LICENSE-MIT-cs.txt`](texyla/Doc/LICENSE-MIT-cs.txt)

> V případě rozporu mezi českým překladem a anglickým originálem platí **anglický originál**.

### Závislost Texy

Texy je dostupné pod licencí **New BSD** nebo **GPL v2/v3**.
Texy **není** součástí tohoto balíčku — uživatel si ji instaluje sám přes Composer
a řídí se její licencí. Tím je zajištěno, že licence Texyly (MIT) a Texy (BSD/GPL)
zůstávají oddělené.

---

## Autor

**Petr Vaněk** — <krteczek01@gmail.com>
Autor původní Texyly (verze 0.2, 2006/2007) a tohoto rewrite.

Na pozdějších verzích (0.3 β / 0.4) se podílel **Jan Marek** a další přispěvatelé.

---

## Stav projektu

Rozpracovaný rewrite. Funkční jádro: toolbar z `config.allowed`, náhled, témata,
`Config` (extract/apply), ochrana `TEXYLA_ENTRY`, všechny stavy konfigurace ošetřeny.

Plánováno: další tlačítka, klávesové zkratky, více témat, testy.
```

### ✅ Co je v tomto README opraveno

1. **Struktura balíčku** odpovídá skutečnosti — `texyla/` je kořen, `demo.php` je jeho součástí, `texyla/texyla/` je samotný editor.
2. **Cesty v příkladech** odpovídají struktuře — `texyla/js/...`, `texyla/Php/texyla.php`, `texyla/themes/...`.
3. **Odkazy na licence** — `texyla/Doc/LICENSE-MIT-*.txt`.
4. **Poznámka o ZIPu** — co do něj patří a co ne (`vendor/`, `public/index.php_`).
5. **Demo je součástí balíčku** — vysvětleno v „Rychlý start".

Tím je README **konzistentní s aktuální strukturou**. 👍